from django.contrib import admin
from django.urls import path, include
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView
from django.conf import settings
from django.conf.urls.static import static

urlpatterns = [
    path('admin/', admin.site.urls),

    path('api/token/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('api/token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    
    path('api/', include('cart.urls')),
    path('api/', include('products.urls')),
    path('api/', include('order.urls')),
    path('api/', include('user.urls')),
    path("api/users/", include("user.urls")),
    path("api/dashboard/", include("dashboard.urls")),
    path("api/contact/",include('contact.urls')),
    path("api/",include('feedback.urls')),
    path("chatbot/", include("chatbot.urls")),
    ]
    

if settings.DEBUG:
    urlpatterns += static(
        settings.MEDIA_URL,
        document_root=settings.MEDIA_ROOT
    )