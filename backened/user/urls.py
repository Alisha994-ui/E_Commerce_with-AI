from django.urls import path
from .views import AdminUserListView, RegisterView, admin_password,current_user, forgot_password, update_user,reset_password
urlpatterns = [
    path("register/", RegisterView.as_view(), name="register"),
    path("me/", current_user, name="current_user"),
    path("admin-users/<int:user_id>/", update_user, name="update_user"),
    path("admin-users/", AdminUserListView.as_view(), name="admin-users"),
    path("forgot-password/", forgot_password, name="forgot-password"),
    path("reset-password/", reset_password, name="reset-password"),
    path("admin-password/<int:user_id>/", admin_password, name="admin_password")] 