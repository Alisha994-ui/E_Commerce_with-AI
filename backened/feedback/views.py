from rest_framework import viewsets
from rest_framework.permissions import IsAuthenticated

from .models import Feedback
from .serializer import FeedbackSerializer

from transformers import pipeline


sentiment_model = pipeline(
    "sentiment-analysis",
    model="nlptown/bert-base-multilingual-uncased-sentiment"
)


class FeedbackViewSet(viewsets.ModelViewSet):

    serializer_class = FeedbackSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return Feedback.objects.filter(
            user=self.request.user
        )

    def perform_create(self, serializer):

        comment = self.request.data.get("comment")

        result = sentiment_model(comment)

        label = result[0]["label"]

        if label in ["4 stars", "5 stars"]:
            sentiment = "positive"

        elif label in ["1 star", "2 stars"]:
            sentiment = "negative"

        else:
            sentiment = "neutral"

        feedback = serializer.save(
            user=self.request.user,
            sentiment=sentiment
        )

        self.update_feedback(
            sentiment,
            feedback.product
        )

    def update_feedback(self, sentiment, product):

        if sentiment == "positive":
            product.positive_feedback += 1

        elif sentiment == "negative":
            product.negative_feedback += 1

        product.save(
            update_fields=[
                "positive_feedback",
                "negative_feedback"
            ]
        )
