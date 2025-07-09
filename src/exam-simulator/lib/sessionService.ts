const sessionService = {
  isReviewActive: false,

  startReview() {
    this.isReviewActive = true;
    console.log("Session review started.");
  },

  stopReview() {
    this.isReviewActive = false;
    console.log("Session review stopped.");
  },
};

export default sessionService;
