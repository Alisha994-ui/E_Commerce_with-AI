from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity

from products.models import Product


def get_recommendations(product_id, limit=4):

    current_product = (
        Product.objects
        .select_related("category")
        .filter(id=product_id)
        .first()
    )

    if not current_product:
        return []

    products = list(
        Product.objects
        .select_related("category")
        .filter(
            is_active=True,
            stock__gt=0
        )
        .exclude(id=product_id)
    )

    if not products:
        return []

    current_text = (
        f"{current_product.name} "
        f"{current_product.description} "
        f"{current_product.category.name}"
    )

    product_texts = []

    for product in products:
        text = (
            f"{product.name} "
            f"{product.description} "
            f"{product.category.name}"
        )
        product_texts.append(text)

    all_texts = [current_text] + product_texts

    vectorizer = TfidfVectorizer(stop_words="english")
    tfidf_matrix = vectorizer.fit_transform(all_texts)

    similarity_scores = cosine_similarity(
        tfidf_matrix[0:1],
        tfidf_matrix[1:]
    )[0]

    recommendations = []

    for index, score in enumerate(similarity_scores):

        product = products[index]

        product.similarity = float(score)

        recommendations.append(product)

    recommendations.sort(
        key=lambda product: product.similarity,
        reverse=True
    )

    return recommendations[:limit]