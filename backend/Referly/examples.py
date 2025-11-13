"""
Example of how the file structure system works
"""

# Example API Response for file structure
EXAMPLE_FILE_STRUCTURE_RESPONSE = {
    "success": True,
    "file_structure": {
        "templates": {
            "id": "templates_folder",
            "name": "Templates (2/2)",  # Used/Limit
            "type": "folder",
            "children": [
                {
                    "id": "template_1",
                    "name": "1. welcome-email.html",  # Auto-numbered display name
                    "type": "file",
                    "extension": "html",
                    "metadata": {
                        "template_number": 1,
                        "internal_name": "Welcome Email",
                        "created_at": "2024-01-15T10:30:00Z",
                        "can_edit": True,
                        "file_type": "template"
                    }
                },
                {
                    "id": "template_2", 
                    "name": "2. job-application.html",
                    "type": "file",
                    "extension": "html",
                    "metadata": {
                        "template_number": 2,
                        "internal_name": "Job Application",
                        "created_at": "2024-01-16T14:20:00Z",
                        "can_edit": True,
                        "file_type": "template"
                    }
                }
            ],
            "metadata": {
                "can_create_new": False,  # Quota reached
                "usage": 2,
                "limit": 2,
                "folder_type": "templates"
            }
        },
        "resumes": {
            "id": "resumes_folder",
            "name": "Resumes (1/2)",
            "type": "folder", 
            "children": [
                {
                    "id": "resume_1",
                    "name": "1. Abhay.pdf",  # Display name from user input
                    "type": "file",
                    "extension": "pdf",
                    "metadata": {
                        "resume_number": 1,
                        "title": "Abhay", # What user typed
                        "file_size": 245760,
                        "file_url": "/media/resumes/2024/01/abhay_resume_abc123.pdf",
                        "created_at": "2024-01-15T09:15:00Z",
                        "can_download": True,
                        "file_type": "resume"
                    }
                }
            ],
            "metadata": {
                "can_upload_new": True,  # Can upload 1 more
                "usage": 1,
                "limit": 2,
                "folder_type": "resumes"
            }
        },
        "drafts": {
            "id": "drafts_folder",
            "name": "Drafts",
            "type": "folder",
            "children": [
                {
                    "id": "draft_template_1",
                    "name": "untitled.html",
                    "type": "file",
                    "extension": "html",
                    "metadata": {
                        "is_draft": True,
                        "draft_type": "template",
                        "created_at": "2024-01-17T16:45:00Z",
                        "can_save_as": True,
                        "file_type": "draft"
                    }
                }
            ],
            "metadata": {
                "folder_type": "drafts",
                "draft_count": 1
            }
        }
    },
    "quota_status": {
        "templates": {
            "used": 2,
            "limit": 2,
            "can_create": False,
            "remaining": 0
        },
        "resumes": {
            "used": 1, 
            "limit": 2,
            "can_create": True,
            "remaining": 1
        },
        "coin_balance": 150
    }
}

# Example workflow scenarios:

WORKFLOW_EXAMPLES = {
    
    "create_new_template": {
        "description": "User creates new template when quota allows",
        "steps": [
            "1. Check quota.can_create_template() = True",
            "2. User works in editor (saves to TemporaryWorkspace every 30sec)",
            "3. User clicks 'Save As' -> creates permanent Template",
            "4. Auto-assigns template_number = 3",
            "5. Updates quota.templates_used = 3",
            "6. Regenerates file_structure JSON"
        ]
    },
    
    "quota_exceeded": {
        "description": "User tries to create template when quota full",
        "steps": [
            "1. Check quota.can_create_template() = False",
            "2. Show modal: 'Template limit reached. Purchase slot for 5 coins?'",
            "3. If user confirms -> deduct 5 coins from wallet",
            "4. Increase quota.template_limit from 2 to 3",
            "5. Now can create template normally"
        ]
    },
    
    "upload_resume": {
        "description": "User uploads resume PDF",
        "steps": [
            "1. User types title: 'Abhay'",
            "2. Uploads PDF file",
            "3. Auto-assigns resume_number = 2", 
            "4. Sets display_name = '2. Abhay.pdf'",
            "5. Stores file in /media/resumes/2024/01/",
            "6. Updates file_structure JSON"
        ]
    },
    
    "email_sending": {
        "description": "Easy template/resume selection for emails",
        "api_call": {
            "method": "POST",
            "url": "/api/send-email/",
            "payload": {
                "template_number": 2,  # Easy selection by number
                "resume_number": 1,    # Easy attachment by number  
                "recipients": ["hr@company.com"],
                "variables": {
                    "name": "John",
                    "company": "TechCorp"
                }
            }
        }
    },
    
    "30_second_sync": {
        "description": "Auto-save drafts every 30 seconds",
        "steps": [
            "1. User types in editor",
            "2. Frontend saves to localStorage immediately", 
            "3. Every 30 seconds -> sync to TemporaryWorkspace",
            "4. No permanent Template created until 'Save As'",
            "5. Drafts show in file explorer under 'Drafts' folder"
        ]
    }
}

# Database table structure summary:

DATABASE_TABLES = {
    "UserQuota": {
        "purpose": "Manages quota limits + stores file_structure JSON",
        "key_fields": [
            "template_limit (default: 2)",
            "templates_used", 
            "resume_limit (default: 2)",
            "resumes_used",
            "file_structure (JSON)"
        ]
    },
    
    "Template": {
        "purpose": "HTML templates with auto-numbering", 
        "key_fields": [
            "template_number (1, 2, 3...)",
            "name (internal)",
            "display_name (1. welcome-email.html)", 
            "content (HTML only)"
        ]
    },
    
    "Resume": {
        "purpose": "PDF resumes with auto-numbering",
        "key_fields": [
            "resume_number (1, 2, 3...)",
            "title (user input: 'Abhay')",
            "display_name (1. Abhay.pdf)",
            "pdf_file (FileField)"
        ]
    },
    
    "TemporaryWorkspace": {
        "purpose": "30-second sync storage before Save As",
        "key_fields": [
            "session_id",
            "draft_templates (JSON)",
            "draft_resumes (JSON)",
            "open_files", 
            "active_file"
        ]
    },
    
    "QuotaPurchase": {
        "purpose": "Coin deduction for additional slots",
        "key_fields": [
            "purchase_type (TEMPLATE_SLOT/RESUME_SLOT)",
            "coins_spent (5 per slot)",
            "transaction (link to wallet)"
        ]
    }
}

print("🚀 Referly Models Implementation Complete!")
print("✅ File structure JSON stored in UserQuota table") 
print("✅ Auto-numbered templates (1, 2, 3...)")
print("✅ PDF resumes with display names (1. Abhay.pdf)")
print("✅ 30-second sync to TemporaryWorkspace")
print("✅ Automatic coin deduction for quota expansion")
print("✅ VSCode-like file explorer structure")