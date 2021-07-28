const dotenv = require('dotenv'); 
const Twitter = require('twitter');
const fetch = require('node-fetch');

dotenv.config({ path: './.env' }); 

const twitterClient = new Twitter({
    consumer_key: process.env.TWITTER_CONSUMER_KEY,
    consumer_secret: process.env.TWITTER_CONSUMER_SECRET,
    access_token_key: process.env.TWITTER_ACCESS_KEY,
    access_token_secret: process.env.TWITTER_ACCESS_SECRET 
});


const newPetsThisHour = async () => {
    //figure out when an hour ago was 
    const hourAgo = new Date(new Date().getTime() - 1000 * 60 * 60).toISOString();
    
    let petsWithPhotos = [];

    try {
        const tokenRes = await fetch('https://api.petfinder.com/v2/oauth2/token', {
            method: 'POST',
            body: `grant_type=client_credentials&client_id=${process.env.PETFINDER_KEY}&client_secret=${process.env.PETFINDER_SECRET}`,
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            }
        });

        //run json on the token request 
        const { access_token } = await tokenRes.json();

        //petResponse 
        const petRes = await fetch(
            `https://api.petfinder.com/v2/animals?type&location=64018&distance=100&after=${hourAgo}`,
            {
                headers: {
                    Authorization: `Bearer ${access_token}`,
                    'Content-Type': 'application/x-www-form-urlencoded',
                }
            }
        )
        //console.log(access_token); //gives you back the access token only
            
        //able to read the data that comes back (the array of animals)
            const { animals } = await petRes.json()
            //console.log(animals);

            //since animals is an array, if no animals are returned: 
            if(animals.length === 0) {
                return null
            }

            if(animals.length > 0) {
                //filter pets w/ photos 
                petsWithPhotos = animals.filter(animal => animal.photos.length > 0)
                return petsWithPhotos;
            }
    } catch (error) {
        console.log(error); 
    }
};


//share pet info to twitter 
const sharePets = async () => {
    const newPets = await newPetsThisHour();
    //if newPets exists 
    if(newPets) {
        //call twitter
        twitterClient.post(
            'statuses/update', 
            { 
                status: `I am looking for a home! Check out my info! ${newPets[0].url}`, //get first item in array w/ url 
            },
            //callback
            function(error, tweet, response) {
                if(!error) { //if there is no error console.log the tweet 
                    console.log(tweet);
                }
                if (error) {
                    console.log(error);
                }
            }
        );
    }
};

//call the function 
//newPetsThisHour();

//call the function
sharePets();

//run function every hour (make it a bot)
setInterval(sharePets, 1000 * 60 * 60); //will share every hour after