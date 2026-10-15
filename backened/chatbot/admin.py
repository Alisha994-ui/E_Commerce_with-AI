from django.contrib import admin

from .models import ChatMessage, ChatSession


class ChatMessageInline(admin.TabularInline):
    model = ChatMessage
    extra = 0
    can_delete = False
    fields = ("created_at", "role", "intent", "content")
    readonly_fields = fields


@admin.register(ChatSession)
class ChatSessionAdmin(admin.ModelAdmin):
    list_display = ("id", "user", "message_count", "created_at", "updated_at")
    list_filter = ("created_at",)
    search_fields = ("id", "user__username", "messages__content")
    readonly_fields = ("id", "user", "created_at", "updated_at")
    inlines = [ChatMessageInline]

    @admin.display(description="Messages")
    def message_count(self, obj):
        return obj.messages.count()


@admin.register(ChatMessage)
class ChatMessageAdmin(admin.ModelAdmin):
    list_display = ("session", "role", "intent", "short_content", "created_at")
    list_filter = ("role", "intent", "created_at")
    search_fields = ("content",)
    readonly_fields = ("session", "role", "intent", "content", "context", "created_at")

    @admin.display(description="Content")
    def short_content(self, obj):
        return obj.content[:80]
