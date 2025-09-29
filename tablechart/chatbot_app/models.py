from django.db import models
from django.utils import timezone

class Conversation(models.Model):
    session_id = models.CharField(max_length=100, unique=True)
    created_at = models.DateTimeField(default=timezone.now)
    updated_at = models.DateTimeField(auto_now=True)
    
    def __str__(self):
        return f"Conversation {self.session_id} - {self.created_at.strftime('%Y-%m-%d %H:%M')}"
    
    class Meta:
        verbose_name = "Konwersacja"
        verbose_name_plural = "Konwersacje"
        ordering = ['-updated_at']

class Message(models.Model):
    ROLE_CHOICES = (
        ('user', 'Użytkownik'),
        ('bot', 'Bot'),
    )
    
    conversation = models.ForeignKey(Conversation, on_delete=models.CASCADE, related_name='messages')
    role = models.CharField(max_length=10, choices=ROLE_CHOICES)
    content = models.TextField()
    timestamp = models.DateTimeField(default=timezone.now)
    
    def __str__(self):
        return f"{self.get_role_display()}: {self.content[:50]}{'...' if len(self.content) > 50 else ''}"
    
    class Meta:
        verbose_name = "Wiadomość"
        verbose_name_plural = "Wiadomości"
        ordering = ['timestamp']