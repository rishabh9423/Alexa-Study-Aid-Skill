const axios = require('axios');
const Alexa = require('ask-sdk-core');
const https = require('https');

let top;
let topic;
let query;
let correctAnswer;
let options;
function setTopic(topic) {
    switch (topic.toLowerCase()) {
        case 'gk':
        case 'g.k.':
        case 'general knowledge':
            top = '9';
            break;
        case 'books':
            top = '10';
            break;
        case 'entertainment':
        case 'film':
        case 'films':
        case 'movie':
        case 'movies':
        case 'cinema':
            top = '11';
            break;
        case 'music':
        case 'songs':
        case 'song':
            top = '12';
            break;
        case 'theatres':
        case 'theater':
            top = '13';
            break;
        case 'television':
        case 'tv':
        case 't.v.':
            top = '14';
            break;
        case 'video games':
        case 'games':
            top = '15';
            break;
        case 'science':
        case 'nature':
            top = '17';
            break;
        case 'computer':
        case 'computers':
            top='18';
            break;
        case 'maths':
        case 'mathematics':
            top='19';
            break;
        case 'mythology':
        case 'god':
        case 'gods':
            top='20';
            break;
        case 'sport':
        case 'sports':
            top='21';
            break;
        case 'geography':
        case 'maps':
            top='22';
            break;
        case 'history':
        case 'past':
            top='23';
            break;
        case 'politics':
        case 'politician':
            top='24';
            break;
        case 'art':
            top='25';
            break;
        case 'celeb':
        case 'celebs':
        case 'celebrities':
            top='26';
            break;
        case 'animals':
        case 'wildlife':
            top='27';
            break;
        case 'vehicles':
            top='28';
            break;
        case 'comic':
        case 'comics':
            top='29';
            break;
        case 'gadgets':
        case 'gadget':
            top='30';
            break;
        case 'anime':
        case 'manga':
            top='31';
            break;
        case 'animation':
        case 'cartoon':
        case 'animations':
            top='32';
            break;
        default:
            top = '8';
    }
}

function getQuestions(top)
{
    return new Promise((resolve, reject) => {
        const options = {
            hostname: 'opentdb.com',
            path: `/api.php?amount=1&category=${top}`,
            method: 'GET'
        };

        https.get(options, (res) => {
            let data = '';
            res.on('data', (chunk) => { data += chunk; });
            res.on('end', () => {
                resolve(JSON.parse(data));
            });
        }).on("error", (err) => {
            reject(err);
        });
    });
}

async function search(query)
{
    const url = `https://en.wikipedia.org/api/rest_v1/page/summary/${query}`;

    try
    {
        const response = await axios.get(url);

        const results = response.data.extract;
        return results;
    } catch (error)
    {
        console.log(error);
        return null;
    }
}

function getQuote()
{
    return new Promise((resolve, reject) => {
        const options = {
            hostname: 'api.forismatic.com',
            path: `/api/1.0/?method=getQuote&lang=en&format=json`,
            method: 'GET'
        };

        https.get(options, (res) => {
            let data = '';
            res.on('data', (chunk) => { data += chunk; });
            res.on('end', () => {
                resolve(JSON.parse(data));
            });
        }).on("error", (err) => {
            reject(err);
        });
    });
}

async function askQuestion(handlerInput, top) {
    const { attributesManager } = handlerInput;
    let sessionAttributes = handlerInput.attributesManager.getSessionAttributes();
    let questions = await getQuestions(top);
    correctAnswer = questions.results[0].correct_answer;
    options = questions.results[0].incorrect_answers;
    sessionAttributes.questions = questions.results;
    attributesManager.setSessionAttributes(sessionAttributes);
    const question = sessionAttributes.questions[0];
    if(questions.results[0].type === 'boolean')
    {
        const speechText = `Your next question is: ${question.question} Is it true or false?`;
        return handlerInput.responseBuilder
        .speak(speechText)
        .reprompt()
        .withShouldEndSession(false)
        .getResponse();
    }
    else
    {
        const speechText = `Your next question is: ${question.question}.`;
        return handlerInput.responseBuilder
        .speak(speechText)
        .reprompt()
        .withShouldEndSession(false)
        .getResponse();
    }
}

function getMotivationalQuote(callback) {
    const url = 'https://api.forismatic.com/api/1.0/?method=getQuote&lang=en&format=json';

    https.get(url, (res) =>
    {
        let data = '';

        res.on('data', (chunk) => {
            data += chunk;
        });

        res.on('end', () => {
            const quote = JSON.parse(data);
            callback(quote.quoteText + 'These words were spoken by ' + quote.quoteAuthor);
        });
    }).on('error', (err) =>
    {
        console.log('Error: ' + err.message);
    });
}

const ResearchEssayIntentHandler = {
    canHandle(handlerInput) {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest'
            && Alexa.getIntentName(handlerInput.requestEnvelope) === 'ResearchEssayIntent';
    },
    async handle(handlerInput) {
        query = Alexa.getSlotValue(handlerInput.requestEnvelope, 'searchTerm');
        const results = await search(query);

        if (!results) {
            return handlerInput.responseBuilder
            .speak('Sorry, I could not retrieve any search results.')
            .getResponse();
        }
        else
        {
            return handlerInput.responseBuilder
            .speak(`${results}`)
            .reprompt()
            .getResponse();
        }
    },
};

const StartQuizIntentHandler =
{
    canHandle(handlerInput)
    {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest'
        && Alexa.getIntentName(handlerInput.requestEnvelope) === 'StartQuizIntent';
    },
    async handle(handlerInput)
    {
        const { attributesManager } = handlerInput;
        let sessionAttributes = handlerInput.attributesManager.getSessionAttributes();
        topic = handlerInput.requestEnvelope.request.intent.slots.topic.value;
        setTopic(topic);
        sessionAttributes.topic = handlerInput.requestEnvelope.request.intent.slots.topic.value;
        attributesManager.setSessionAttributes(sessionAttributes);
        const questions = await getQuestions(top);
        if(questions.response_code === 1)
        {
            const results = await search(topic);
            if (!results)
            {
                return handlerInput.responseBuilder
                    .speak('We do not have any questions for this category. But we are continuously working on expanding our database. Thank you and sorry for the inconvenience.')
                    .getResponse();
            }
            else
            {
                return handlerInput.responseBuilder
                    .speak(`${results}` + " Unfortunately we do not have any questions for this category. But we are continuously working on expanding our database. Thank you and sorry for the inconvenience.")
                    .getResponse();
            }
        }
        else
        {
            correctAnswer = questions.results[0].correct_answer;
            options = questions.results[0].incorrect_answers;
            sessionAttributes.questions = questions.results;
            sessionAttributes.totalq = 0;
            sessionAttributes.correctans = 0;
            attributesManager.setSessionAttributes(sessionAttributes);
            const question = sessionAttributes.questions[0];
            if(questions.results[0].type === 'boolean')
            {
                const speechText = `Here is your question: ${question.question} Is it true or false?`;
                return handlerInput.responseBuilder
                .speak(speechText)
                .reprompt()
                .getResponse();
            }
            else
            {
                const speechText = `Here is your question: ${question.question}.`;
                return handlerInput.responseBuilder
                .speak(speechText)
                .reprompt()
                .getResponse();
            }
        }
    }
}

const OptionsIntentHandler = {
    canHandle(handlerInput)
    {
        return handlerInput.requestEnvelope.request.type === 'IntentRequest'
            && handlerInput.requestEnvelope.request.intent.name === 'OptionsIntent';
    },
    async handle(handlerInput)
    {
        let speechText = `Your options are ${options} and ${correctAnswer}.`
        return handlerInput.responseBuilder
        .speak(speechText)
        .reprompt()
        .getResponse();
    }
}

const ScoreIntentHandler = {
    canHandle(handlerInput)
    {
        return handlerInput.requestEnvelope.request.type === 'IntentRequest'
            && handlerInput.requestEnvelope.request.intent.name === 'ScoreIntent';
    },
    async handle(handlerInput)
    {
        let sessionAttributes = handlerInput.attributesManager.getSessionAttributes();
            const speechText = `You got ${sessionAttributes.correctans} out of ${sessionAttributes.totalq} questions correct. Please say yes to continue.`;
            return handlerInput.responseBuilder
            .speak(speechText)
            .reprompt()
            .getResponse();
    }
}

const ChangeTopicHandler = {
    canHandle(handlerInput)
    {
        return handlerInput.requestEnvelope.request.type === 'IntentRequest'
            && handlerInput.requestEnvelope.request.intent.name === 'ChangeTopicIntent';
    },
    async handle(handlerInput)
    {
        const { attributesManager } = handlerInput;
        let sessionAttributes = attributesManager.getSessionAttributes();
        sessionAttributes.topic = handlerInput.requestEnvelope.request.intent.slots.topic.value;
        attributesManager.setSessionAttributes(sessionAttributes);
        return handlerInput.responseBuilder
        .speak(`Sure! Your topic has been changed to ${sessionAttributes.topic}. Say yes to confirm.`)
        .reprompt()
        .getResponse();
    }
}

const AnswerIntentHandler = {
    canHandle(handlerInput)
    {
        return handlerInput.requestEnvelope.request.type === 'IntentRequest'
            && handlerInput.requestEnvelope.request.intent.name === 'AnswerIntent';
    },
    async handle(handlerInput) {
        // retrieve user's answer
        let userAnswer = Alexa.getSlotValue(handlerInput.requestEnvelope, 'answer');
        // compare with correct answer
        let speechText;
        let sessionAttributes = handlerInput.attributesManager.getSessionAttributes();
        if (userAnswer.toLowerCase() === correctAnswer.toLowerCase()) {
            speechText = 'Congratulations! Your answer is correct';
            sessionAttributes.correctans = sessionAttributes.correctans + 1;
        } else {
            speechText = 'Sorry, your answer is incorrect. The correct answer is ' + correctAnswer;
        }
        sessionAttributes.totalq = sessionAttributes.totalq + 1;
        return handlerInput.responseBuilder
            .speak(speechText + '. '+ 'Do you want another question?')
            .withSimpleCard('Answer', speechText)
            .reprompt()
            .getResponse();
    }
};

const AnotherQIntentHandler = {
    canHandle(handlerInput)
    {
        return handlerInput.requestEnvelope.request.type === 'IntentRequest'
            && handlerInput.requestEnvelope.request.intent.name === 'AnotherQIntent';
    },
    async handle(handlerInput)
    {
        const { attributesManager } = handlerInput;
        let sessionAttributes = attributesManager.getSessionAttributes();
        // If the topic has already been selected, use that topic instead of asking the user again
        if (sessionAttributes.topic)
        {
            setTopic(sessionAttributes.topic);
            return askQuestion(handlerInput, top);
        }
        else
        {
            console.log("no session attribute found");
        }
        return handlerInput.responseBuilder
            .reprompt()
            .getResponse();
    }
}

const MotivateIntentHandler = {
    canHandle(handlerInput)
    {
        return handlerInput.requestEnvelope.request.type === 'IntentRequest'
            && handlerInput.requestEnvelope.request.intent.name === 'MotivateIntent';
    },
    handle(handlerInput) {
        return new Promise((resolve, reject) =>
        {
            getMotivationalQuote((quote) =>
            {
                const speechText = `Here's a motivational quote for you: ` + quote + `.`;

                resolve(handlerInput.responseBuilder
                    .speak(speechText)
                    .getResponse());
            });
        });
    },
}

const LaunchRequestHandler = {
    canHandle(handlerInput) {
        return handlerInput.requestEnvelope.request.type === 'LaunchRequest';
    },
    handle(handlerInput) {
const speechText = 'Welcome to the Study Aid Skill. How can I help you?';

        return handlerInput.responseBuilder
            .speak(speechText)
            .reprompt(speechText)
            .withSimpleCard('Hello World', speechText)
            .getResponse();
    }
};

const CancelAndStopIntentHandler = {
    canHandle(handlerInput) {
        return handlerInput.requestEnvelope.request.type === 'IntentRequest'
            && (handlerInput.requestEnvelope.request.intent.name === 'AMAZON.CancelIntent'
                || handlerInput.requestEnvelope.request.intent.name === 'AMAZON.StopIntent');
    },
    handle(handlerInput) {
        let sessionAttributes = handlerInput.attributesManager.getSessionAttributes();
        if(sessionAttributes.totalq)
        {
            const speechText = `You got ${sessionAttributes.correctans} out of ${sessionAttributes.totalq} questions correct. Thank you for using Study Aid Skill! Goodbye!`;
            return handlerInput.responseBuilder
            .speak(speechText)
            .getResponse();
        }
        else
        {
            const speechText = 'Thank you for using Study Aid Skill! Goodbye!';
            return handlerInput.responseBuilder
            .speak(speechText)
            .getResponse();
        }
    }
};

const HelpIntentHandler = {
    canHandle(handlerInput) {
        return handlerInput.requestEnvelope.request.type === 'IntentRequest'
            && handlerInput.requestEnvelope.request.intent.name === 'AMAZON.HelpIntent';
    },
    handle(handlerInput) {
        const speechText = 'You can say hello to me! How can I help you?';

        return handlerInput.responseBuilder
            .speak(speechText)
            .reprompt(speechText)
            .withSimpleCard('Hello World', speechText)
            .getResponse();
    }
};

const NavigateHomeIntent = {
    canHandle(handlerInput) {
        return handlerInput.requestEnvelope.request.type === 'IntentRequest'
            && handlerInput.requestEnvelope.request.intent.name === 'NavigateHomeIntent';
    },
    handle(handlerInput) {
        const speechText = 'Welcome home! How can I help you today?';

        return handlerInput.responseBuilder
        .speak(speechText)
        .reprompt(speechText)
        .getResponse();
    }
};

const skillBuilder = Alexa.SkillBuilders.custom();

exports.handler = skillBuilder
    .addRequestHandlers(
    LaunchRequestHandler,
    CancelAndStopIntentHandler,
    HelpIntentHandler,
    NavigateHomeIntent,
    StartQuizIntentHandler,
    ResearchEssayIntentHandler,
    AnswerIntentHandler,
    AnotherQIntentHandler,
    OptionsIntentHandler,
    ChangeTopicHandler,
    ScoreIntentHandler,
    MotivateIntentHandler
    )
.lambda();
