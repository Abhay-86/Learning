from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import AllowAny
from drf_spectacular.utils import extend_schema, OpenApiExample
from .serializers import SendTemplateEmailSerializer, BulkEmailSendSerializer
from .utils import send_templated_email
from .models import BulkEmailLog
import gspread
from google.oauth2.service_account import Credentials

# Google Sheets config
SERVICE_ACCOUNT_FILE = "/Users/abhay/Documents/Learn/Learning/Credentials/ordinal-quarter-387322-7194228669a8.json"
SCOPES = ["https://www.googleapis.com/auth/spreadsheets", "https://www.googleapis.com/auth/drive"]
SHEET_NAME = "HR Sheet"

# --- Single Email Endpoint ---
@extend_schema(
    examples=[
        OpenApiExample(
            "Sample Email Request",
            value={
                "email": "abhaysingh@iitbhilai.ac.in",
                "subject": "Welcome!",
                "template_name": "resume",
                "context": {"name": "Abhay"},
                "attachment_no": "Abhay"
            },
        ),
    ]
)
class SendTemplateEmailView(APIView):
    permission_classes = [AllowAny]

    @extend_schema(request=SendTemplateEmailSerializer, responses={200: dict})
    def post(self, request):
        serializer = SendTemplateEmailSerializer(data=request.data)
        if serializer.is_valid():
            data = serializer.validated_data
            send_templated_email(
                subject=data["subject"],
                recipient=data["email"],
                template_name=data["template_name"],
                context=data.get("context", {}),
                attachment_no=data.get("attachment_no")
            )
            return Response({"message": "Email sent successfully!"}, status=status.HTTP_200_OK)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


# --- Bulk Email Endpoint ---
@extend_schema(
    request=BulkEmailSendSerializer,
    responses={200: dict},
    examples=[
        OpenApiExample(
            "Bulk Email Request",
            value={"context": {"name": "User"}},
            description="Optional context applied to all template emails",
        ),
    ]
)
class BulkSendEmailView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = BulkEmailSendSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        context = serializer.validated_data.get("context", {})

        # Connect to Google Sheet
        creds = Credentials.from_service_account_file(SERVICE_ACCOUNT_FILE, scopes=SCOPES)
        client = gspread.authorize(creds)
        sheet = client.open(SHEET_NAME).sheet1
        rows = sheet.get_all_records()

        sent_count = 0
        skipped_count = 0

        for row in rows:
            email = row.get("email")
            template_name = row.get("template_name")
            attachment_no = row.get("attachment_no")
            subject = row.get("subject", "Hello")
            name = row.get("name", "Team")

            # Skip row if required fields are missing
            if not email or not template_name:
                print(f"[⚠️] Skipping invalid row: {row}")
                skipped_count += 1
                continue

            # Skip if already sent
            if BulkEmailLog.objects.filter(email=email, sent=True).exists():
                skipped_count += 1
                continue

            # Send email
            send_templated_email(subject, email, template_name, context, attachment_no)

            # Log email as sent
            BulkEmailLog.objects.update_or_create(
                email=email,
                defaults={
                    "template_name": template_name,
                    "attachment_no": attachment_no,
                    "sent": True
                }
            )
            sent_count += 1

        return Response({
            "message": "Bulk email process completed.",
            "sent_count": sent_count,
            "skipped_count": skipped_count
        }, status=status.HTTP_200_OK)
