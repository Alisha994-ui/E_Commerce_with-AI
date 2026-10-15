from rest_framework.permissions import BasePermission, SAFE_METHODS


class IsOrderOwnerOrAdmin(BasePermission):

    def has_permission(self, request, view):
        return request.user.is_authenticated

    def has_object_permission(self, request, view, obj):

        if request.user.is_staff:
            return True

        if obj.user == request.user:
            return request.method in SAFE_METHODS

        return False


class IsOrderItemOwnerOrAdmin(BasePermission):

    def has_permission(self, request, view):
        return request.user.is_authenticated

    def has_object_permission(self, request, view, obj):

        if request.user.is_staff:
            return True

        if obj.order.user == request.user:
            return request.method in SAFE_METHODS

        return False