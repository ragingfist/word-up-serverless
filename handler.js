'use strict';

const axios = require('axios');
const getSentencesFromWeb = require('./getSentence');

/**
 * This sample demonstrates a simple skill built with the Amazon Alexa Skills Kit.
 * The Intent Schema, Custom Slots, and Sample Utterances for this skill, as well as
 * testing instructions are located at http://amzn.to/1LzFrj6
 *
 * For additional samples, visit the Alexa Skills Kit Getting Started guide at
 * http://amzn.to/1LGWsLG
 */


// --------------- Helpers that build all of the responses -----------------------

function buildSpeechletResponse(title, output, repromptText, shouldEndSession) {
    return {
        outputSpeech: {
            type: 'SSML',
            ssml: `<speak>${output}</speak>`,
        },
        card: {
            type: 'Simple',
            title: title,
            content: output,
        },
        reprompt: {
            outputSpeech: {
                type: 'SSML',
                ssml: `<speak>${repromptText}</speak>`,
            },
        },
        shouldEndSession,
    };
}

function buildResponse(sessionAttributes, speechletResponse) {
    return {
        version: '1.0',
        sessionAttributes,
        response: speechletResponse,
    };
}


// --------------- Functions that control the skill's behavior -----------------------

function handleHelp(callback) {
    // If we wanted to initialize the session to have some attributes we could add those here.
    const sessionAttributes = {};
    const cardTitle = 'Word Up';
    const helpMsg = "Ask me how to use a word in a sentence by saying: how do I use <break strength='medium'>apple</break>?";
    const shouldEndSession = false;

    callback(sessionAttributes,
        buildSpeechletResponse(cardTitle, helpMsg, helpMsg, shouldEndSession));
}

function handleStop(callback) {
    const cardTitle = 'We out!';
    const speechOutput = 'Until next time. We out!';
    // Setting this to true ends the session and exits the skill.
    const shouldEndSession = true;

    callback({}, buildSpeechletResponse(cardTitle, speechOutput, null, shouldEndSession));
}

function getSentences(word) {
    return getSentencesFromWeb(word);
}

/**
 * Sets the word in the session and prepares the speech to reply to the user.
 */
function handleUseInSentenceIntent(intent, session, callback) {
    const wordSlot = intent.slots.word;
    const shouldEndSession = false;
    let cardTitle = '';
    let reprompt = '';
    let speechOutput = '';
    let sessionAttributes = {};
    
    if (wordSlot) {
        const word = wordSlot.value;
        getSentences(word).then(function (sentences) {
            if (sentences.length > 0) {
                sessionAttributes = {
                    index: 0,
                    word, 
                    sentences
                };
                speechOutput = `${sentences[0]} <break strength='strong'/> Another one?`;
                reprompt = `Another example for ${word}?`;
                cardTitle = `Example for ${word}`;
            } else {
                speechOutput = `I couldn't find any examples for ${word}. Try another word.`;
                reprompt = speechOutput;
                cardTitle = `Got nuthin' for ya`;
            }
            callback(sessionAttributes,
                buildSpeechletResponse(cardTitle, speechOutput, reprompt, shouldEndSession));        
        }).catch(function (error) {
            speechOutput = `I'm having trouble finding any examples for ${word}. Try another word.`;
            cardTitle = `Oh snap!`;
            callback(sessionAttributes,
                buildSpeechletResponse(cardTitle, speechOutput, speechOutput, shouldEndSession));    
        });
    } else {
        speechOutput = "Say what? Tell me again.";
        cardTitle = "Say what?";
        callback(sessionAttributes,
            buildSpeechletResponse(cardTitle, speechOutput, speechOutput, shouldEndSession));
    }
}

function handleAnotherExampleIntent(intent, session, callback) {
    let index, sentences, word;
    const sessionAttributes = session.attributes;
    let shouldEndSession = false;
    let speechOutput = '';
    let reprompt = '';
    let cardTitle = '';

    if (sessionAttributes) {
        word = sessionAttributes.word;
        sentences = sessionAttributes.sentences;
        index = sessionAttributes.index;
    }

    if (sentences && sentences[index+1]) {
        let sentence = sentences[index+1];
        speechOutput = `${sentence} <break strength="medium"/> Another one?`;    
        reprompt = `Another example for ${word}?`;
        cardTitle = `Another example for ${word}`;
        sessionAttributes.index++;
    } else {
        speechOutput = `There are no more examples for ${word}. <break strength="strong"/> Try another word.`;
        reprompt = speechOutput;
        cardTitle = `Ain't got no more for ya`;

    }

    // Setting repromptText to null signifies that we do not want to reprompt the user.
    // If the user does not respond or says something that is not understood, the session
    // will end.
    callback(sessionAttributes,
         buildSpeechletResponse(cardTitle, speechOutput, reprompt, shouldEndSession));
}

// --------------- Events -----------------------

/**
 * Called when the session starts.
 */
function onSessionStarted(sessionStartedRequest, session) {
    console.log(`onSessionStarted requestId=${sessionStartedRequest.requestId}, sessionId=${session.sessionId}`);
}

/**
 * Called when the user launches the skill without specifying what they want.
 */
function onLaunch(launchRequest, session, callback) {
    console.log(`onLaunch requestId=${launchRequest.requestId}, sessionId=${session.sessionId}`);

    // Dispatch to your skill's launch.
    handleHelp(callback);
}

/**
 * Called when the user specifies an intent for this skill.
 */
function onIntent(intentRequest, session, callback) {
    console.log(`onIntent requestId=${intentRequest.requestId}, sessionId=${session.sessionId}`);

    const intent = intentRequest.intent;
    const intentName = intentRequest.intent.name;

    // Dispatch to your skill's intent handlers
    if (intentName === 'AnotherExampleIntent') {
        handleAnotherExampleIntent(intent, session, callback);
    } else if (intentName === 'UseInSentenceIntent') {
        handleUseInSentenceIntent(intent, session, callback);
    } else if (intentName === 'AMAZON.HelpIntent') {
        handleHelp(callback);
    } else if (intentName === 'AMAZON.StopIntent' || intentName === 'AMAZON.CancelIntent') {
        handleStop(callback);
    } else {
        throw new Error('Invalid intent');
    }
}

/**
 * Called when the user ends the session.
 * Is not called when the skill returns shouldEndSession=true.
 */
function onSessionEnded(sessionEndedRequest, session) {
    console.log(`onSessionEnded requestId=${sessionEndedRequest.requestId}, sessionId=${session.sessionId}`);
    // Add cleanup logic here
}


// --------------- Main handler -----------------------

// Route the incoming request based on type (LaunchRequest, IntentRequest,
// etc.) The JSON body of the request is provided in the event parameter.
module.exports.main = (event, context, callback) => {
    try {
        console.log(`event.session.application.applicationId=${event.session.application.applicationId}`);

        /**
         * Uncomment this if statement and populate with your skill's application ID to
         * prevent someone else from configuring a skill that sends requests to this function.
         */
        if (event.session.application.applicationId !== 'amzn1.ask.skill.5d5fb0b2-ba47-4fd2-80b9-9a42541a5a6b') {
             callback('Invalid Application ID');
        }

        if (event.session.new) {
            onSessionStarted({ requestId: event.request.requestId }, event.session);
        }

        if (event.request.type === 'LaunchRequest') {
            onLaunch(event.request,
                event.session,
                (sessionAttributes, speechletResponse) => {
                    callback(null, buildResponse(sessionAttributes, speechletResponse));
                });
        } else if (event.request.type === 'IntentRequest') {
            onIntent(event.request,
                event.session,
                (sessionAttributes, speechletResponse) => {
                    callback(null, buildResponse(sessionAttributes, speechletResponse));
                });
        } else if (event.request.type === 'SessionEndedRequest') {
            onSessionEnded(event.request, event.session);
            callback();
        }
    } catch (err) {
        callback(err);
    }
};
