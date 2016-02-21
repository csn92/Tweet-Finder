if(Meteor.isClient){

  Template.list.helpers({
    Tweets: function(){
      return Session.get("Tweets") || [];
    }

  });

  Template.list.events({
    'click #fetchButton': function(event){
        Session.set("Tweets",null);
        event.preventDefault();
        var handle = $('[name=handle]').val();
        var topic = $('[name=topic]').val().toLowerCase();
        console.log("Handle: "+handle+", Topic: "+topic);
        Meteor.call('displayTweets',handle,topic,function(error,respJson){
          if(error){
            console.log("Error occured on receiving data on server");
            console.log("Error: "+error.reason);
          }
          else{
            console.log("Clustered Tweets");
            Session.set("Tweets",respJson.res.tweet);

          }
        });

      }
    });

       
}

if (Meteor.isServer) {

    var Twit = Meteor.npmRequire('twit');
    var Future = Meteor.npmRequire('fibers/future');

    Meteor.methods({

      'displayTweets': function(handle,topic) {
        try{

            var twit = new Twit({
            consumer_key: Meteor.settings.API_Key,
            consumer_secret: Meteor.settings.API_Secret_Key,
            access_token: Meteor.settings.Access_Token,
            access_token_secret: Meteor.settings.Access_Token_Secret
            });

            console.log("Getting the statuses for Handle:"+handle+", Topic:"+topic);
            var fut = new Future();
            twit.get('statuses/user_timeline', {
                screen_name: handle,
                count: 100
            }, function(err, res) {
                  if(typeof res !='undefined'){
                      var new_tweets = {
                        tweet: []
                      };
                      for(var i=0;i<res.length;i++){
                        if(res[i]["text"].toLowerCase().indexOf(topic) >= 0){
                          new_tweets.tweet.push({ 
                          "text" : res[i]["text"]
                          });
                        }
                      }

                      if(new_tweets.tweet.length==0){
                        new_tweets.tweet.push({
                          "text":"No tweets!"
                        });
                      }

                  }
                
                  fut.return({
                      err: err,
                      res: new_tweets
                  });

                });

              return fut.wait();

        }
        catch(ex){
          console.log("Error! "+ex);

        }
       
      }

    });
  }

  

