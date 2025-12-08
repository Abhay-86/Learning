import os
from django.core.mail import EmailMultiAlternatives
from django.template.loader import render_to_string
from django.conf import settings

def send_templated_email(subject, recipient, template_name, context=None, attachment_no=None, cc=None, bcc=None):
    context = context or {}
    html_content = render_to_string(f"emails/{template_name}.html", context)
    text_content = subject  # fallback plain text

    msg = EmailMultiAlternatives(
        subject,
        text_content,
        settings.DEFAULT_FROM_EMAIL,
        [recipient],
        cc=cc or [],
        bcc=bcc or [],
    )

    msg.attach_alternative(html_content, "text/html")

    if attachment_no:
        file_path = os.path.join(
            settings.BASE_DIR,
            "emails",
            "templates",
            "attachments",
            f"{attachment_no}.pdf"
        )
        if os.path.exists(file_path):
            with open(file_path, "rb") as f:
                msg.attach(f"{attachment_no}.pdf", f.read(), "application/pdf")
            print(f"[✅] Attached file: {file_path}")
        else:
            print(f"[⚠️] Attachment not found for {attachment_no}: {file_path}")

    msg.send()
