from django.contrib import admin

from .models import Category, Product, SubCategory


class SubCategoryInline(admin.TabularInline):
    model = SubCategory
    extra = 0


@admin.register(Category)
class CategoryAdmin(admin.ModelAdmin):
    list_display = ("id", "name", "description")
    ordering = ("id",)
    inlines = [SubCategoryInline]


@admin.register(SubCategory)
class SubCategoryAdmin(admin.ModelAdmin):
    list_display = ("id", "name", "category")
    list_filter = ("category",)
    search_fields = ("name",)


@admin.register(Product)
class ProductAdmin(admin.ModelAdmin):
    list_display = ("id", "name", "category", "subcategory", "price", "stock", "is_active")
    list_filter = ("category", "subcategory", "is_active")
    search_fields = ("name", "description")
    ordering = ("id",)
