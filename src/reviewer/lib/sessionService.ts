const sessionService = {
  isReviewActive: false,

  startReview() {
    this.isReviewActive = true;
  },

  stopReview() {
    this.isReviewActive = false;
  },
};

export default sessionService;
