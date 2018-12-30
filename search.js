const reddit = {};

reddit.search = function(snooPromise, subreddit, contentType) {
  return snooPromise.then(r => {
    content = (contentType === "upvoted")
      ? r.getMe().getUpvotedContent().fetchAll()
      : r.getMe().getSavedContent().fetchAll();      
    return content.then(list => {
      const filteredList = list
        .filter(post => post.constructor.name === "Submission")
        .filter(post => post.subreddit.display_name.toLowerCase() === subreddit);
      return filteredList;
    });
  }).catch(err => console.log(err));
};

module.exports = reddit;