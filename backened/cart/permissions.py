from rest_framework.permissions import BasePermission

class IsCartOwner(BasePermission):

    def has_permission(self, request, view):
        return request.user.is_authenticated
    
    def has_object_permission(self, request, view, obj):
        if request.user.is_staff:
            return request.method in ["GET", "HEAD", "OPTIONS"]
        return obj.user == request.user

class IsCartItemOwner(BasePermission):

    def has_permission(self, request, view):
        return request.user.is_authenticated

    def has_object_permission(self, request, view, obj):
        if request.user.is_staff:
            return request.method in ["GET", "HEAD", "OPTIONS"]
        return obj.cart.user == request.user