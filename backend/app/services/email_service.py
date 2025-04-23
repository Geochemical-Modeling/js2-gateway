import emails
import logging
from typing import List, Optional
from app.config import settings
from sqlmodel import select, Session
from app.db import User, get_session

logger = logging.getLogger(__name__)

def send_email(
    to_email: str,
    subject: str,
    html_content: str,
    text_content: Optional[str] = None,
) -> bool:
    """
    Send an email using the configured email service.
    Returns True if successful, False otherwise.
    """
    if not text_content:
        text_content = html_content.replace('<br>', '\n')
    
    try:
        message = emails.Message(
            subject=subject,
            html=html_content,
            text=text_content,
            mail_from=(settings.EMAIL_FROM_NAME, settings.EMAIL_FROM)
        )
        
        response = message.send(
            to=to_email,
            smtp={
                "host": settings.SMTP_HOST, 
                "port": settings.SMTP_PORT,
                "user": settings.SMTP_USER,
                "password": settings.SMTP_PASSWORD,
                "tls": True
            }
        )
        
        if response.status_code not in [250, 200, 201, 202]:
            logger.error(f"Failed to send email to {to_email}, status_code={response.status_code}")
            return False
            
        logger.info(f"Email sent successfully to {to_email}")
        return True
        
    except Exception as e:
        logger.error(f"Error sending email: {str(e)}")
        return False

def get_admin_emails(session: Session) -> List[str]:
    """
    Get all admin emails from the database.
    """
    try:
        statement = select(User).where(User.admin_rights == 1, User.archived == 0)
        admin_users = session.exec(statement).all()
        return [user.email for user in admin_users if user.email]
    except Exception as e:
        logger.error(f"Error getting admin emails: {str(e)}")
        return []

def send_new_user_notification(user_id: int, user_name: str, user_email: str) -> bool:
    """
    Send notification emails about a new user to all admins.
    """
    admin_email = settings.ADMIN_NOTIFICATION_EMAIL  # Temporary hardcoded admin email
    
    subject = "New User Registration - Action Required"
    html_content = f"""
    <h2>New User Registration</h2>
    <p>A new user has registered and completed the onboarding process:</p>
    <ul>
        <li><strong>Name:</strong> {user_name}</li>
        <li><strong>Email:</strong> {user_email}</li>
    </ul>
    <p>This user is waiting for approval. Please review this registration by visiting the admin panel:</p>
    <p><a href="{settings.FRONTEND_URL}/AdminPage">Go to Admin Panel</a></p>
    """
    
    success = send_email(admin_email, subject, html_content)
    
    # Commented out section for sending to all admins (will be implemented later)
    """
    with get_session() as session:
        if session:
            admin_emails = get_admin_emails(session)
            for admin_email in admin_emails:
                success = send_email(admin_email, subject, html_content)
                if not success:
                    logger.error(f"Failed to send admin notification to {admin_email}")
    """
    
    return success

def send_user_pending_notification(user_email: str, user_name: str) -> bool:
    """
    Send a notification to the user that their account is pending approval.
    """
    subject = "Your JS2 Gateway Account is Pending Approval"
    html_content = f"""
    <h2>Thank you for registering, {user_name}!</h2>
    <p>Your account has been created and is now pending administrator approval.</p>
    <p>You will receive another email when your account has been approved.</p>
    <p>If you have any questions, please contact our support team.</p>
    <br>
    <p>Thank you,<br>JS2 Geochemical Gateway Team</p>
    """
    
    return send_email(user_email, subject, html_content)

def send_account_approved_notification(user_email: str, user_name: str) -> bool:
    """
    Send a notification to the user that their account has been approved.
    """
    subject = "Your JS2 Gateway Account Has Been Approved"
    html_content = f"""
    <h2>Good news, {user_name}!</h2>
    <p>Your JS2 Geochemical Gateway account has been approved.</p>
    <p>You can now log in and access all the tools and resources available on the platform.</p>
    <p><a href="{settings.FRONTEND_URL}">Go to JS2 Gateway</a></p>
    <br>
    <p>Thank you,<br>JS2 Geochemical Gateway Team</p>
    """
    
    return send_email(user_email, subject, html_content)