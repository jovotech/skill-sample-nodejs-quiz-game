'use strict';

// ------------------------------------------------------------------
// APP INITIALIZATION
// ------------------------------------------------------------------

const { App } = require('jovo-framework');
const { Alexa } = require('jovo-platform-alexa');
const { JovoDebugger } = require('jovo-plugin-debugger');
const { FileDb } = require('jovo-db-filedb');

const app = new App();

app.use(new Alexa(), new JovoDebugger(), new FileDb());

// ------------------------------------------------------------------
// APP LOGIC
// ------------------------------------------------------------------

app.setHandler({
  LAUNCH() {
    this.ask(welcomeMessage, helpMessage);
  },

  QuizIntent() {
    console.log('Inside QuizIntent');

    const attributes = this.$session.$data;
    this.setState('QuizState');
    attributes.counter = 0;
    attributes.quizScore = 0;

    var question = askQuestion(this);
    var speakOutput = startQuizMessage + question;
    var repromptOutput = question;

    const item = attributes.quizItem;
    const property = attributes.quizProperty;

    // Add display support later

    this.ask(speakOutput, repromptOutput);
  },

  AnswerIntent() {
    console.log('Inside AnswerIntent');

    //GRABBING ALL SLOT VALUES AND RETURNING THE MATCHING DATA OBJECT.
    const item = getItem(this.$alexaSkill.$request.request.intent.slots);

    //IF THE DATA WAS FOUND
    if (item && item[Object.getOwnPropertyNames(data[0])[0]] !== undefined) {
      // Add display support later

      this.ask(getSpeechDescription(item), repromptSpeech);
    }
    //IF THE DATA WAS NOT FOUND
    else {
      this.ask(getBadAnswer(item));
    }
  },

  HelpIntent() {
    console.log('Inside HelpIntent');

    this.ask(helpMessage);
  },

  END() {
    if (this.$alexaSkill.getEndReason()) {
      console.log(
        `Session ended with reason: ${JSON.stringify(
          this.$alexaSkill.getEndReason()
        )}`
      );

      return;
    }
    this.tell(exitSkillMessage);
  },

  ON_ERROR() {
    console.log('Inside ON_ERROR');
    console.log(
      `Error handled: ${JSON.stringify(this.$alexaSkill.getError())}`
    );
    console.log(`Request: ${JSON.stringify(this.$alexaSkill.$request)}`);

    this.ask(helpMessage);
  },

  QuizState: {
    AnswerIntent() {
      console.log('Inside QuizState - AnswerIntent');

      const attributes = this.$session.$data;

      var speakOutput = ``;
      var repromptOutput = ``;
      const item = attributes.quizItem;
      const property = attributes.quizProperty;
      const isCorrect = compareSlots(
        this.$alexaSkill.$request.request.intent.slots,
        item[property]
      );

      if (isCorrect) {
        speakOutput = getSpeechCon(true);
        attributes.quizScore += 1;
      } else {
        speakOutput = getSpeechCon(false);
      }

      speakOutput += getAnswer(property, item);
      var question = ``;
      //IF YOUR QUESTION COUNT IS LESS THAN 10, WE NEED TO ASK ANOTHER QUESTION.
      if (attributes.counter < 10) {
        speakOutput += getCurrentScore(
          attributes.quizScore,
          attributes.counter
        );
        question = askQuestion(this);
        speakOutput += question;
        repromptOutput = question;

        // Add display support later

        this.ask(speakOutput, repromptOutput);
      } else {
        speakOutput +=
          getFinalScore(attributes.quizScore, attributes.counter) +
          exitSkillMessage;

        // Add display support later

        this.tell(speakOutput);
      }
    },

    RepeatIntent() {
      console.log('Inside QuizState - RepeatIntent');

      const attributes = this.$session.$data;
      const question = getQuestion(
        attributes.counter,
        attributes.quizproperty,
        attributes.quizitem
      );

      this.ask(question);
    }
  }
});

// ------------------------------------------------------------------
// HELPERS
// ------------------------------------------------------------------

// returns true if the skill is running on a device with a display (show|spot)
function supportsDisplay(handlerInput) {
  var hasDisplay =
    handlerInput.requestEnvelope.context &&
    handlerInput.requestEnvelope.context.System &&
    handlerInput.requestEnvelope.context.System.device &&
    handlerInput.requestEnvelope.context.System.device.supportedInterfaces &&
    handlerInput.requestEnvelope.context.System.device.supportedInterfaces
      .Display;
  return hasDisplay;
}

function getBadAnswer(item) {
  return `I'm sorry. ${item} is not something I know very much about in this skill. ${helpMessage}`;
}

function getCurrentScore(score, counter) {
  return `Your current score is ${score} out of ${counter}. `;
}

function getFinalScore(score, counter) {
  return `Your final score is ${score} out of ${counter}. `;
}

function getCardTitle(item) {
  return item.StateName;
}

function getSmallImage(item) {
  return `https://m.media-amazon.com/images/G/01/mobile-apps/dex/alexa/alexa-skills-kit/tutorials/quiz-game/state_flag/720x400/${
    item.Abbreviation
  }._TTH_.png`;
}

function getLargeImage(item) {
  return `https://m.media-amazon.com/images/G/01/mobile-apps/dex/alexa/alexa-skills-kit/tutorials/quiz-game/state_flag/1200x800/${
    item.Abbreviation
  }._TTH_.png`;
}

function getImage(height, width, label) {
  return imagePath
    .replace('{0}', height)
    .replace('{1}', width)
    .replace('{2}', label);
}

function getBackgroundImage(label, height = 1024, width = 600) {
  return backgroundImagePath
    .replace('{0}', height)
    .replace('{1}', width)
    .replace('{2}', label);
}

function getSpeechDescription(item) {
  return `${item.StateName} is the ${
    item.StatehoodOrder
  }th state, admitted to the Union in ${item.StatehoodYear}.  The capital of ${
    item.StateName
  } is ${item.Capital}, and the abbreviation for ${
    item.StateName
  } is <break strength='strong'/><say-as interpret-as='spell-out'>${
    item.Abbreviation
  }</say-as>.  I've added ${
    item.StateName
  } to your Alexa app.  Which other state or capital would you like to know about?`;
}

function formatCasing(key) {
  return key.split(/(?=[A-Z])/).join(' ');
}

function getQuestion(counter, property, item) {
  return `Here is your ${counter}th question.  What is the ${formatCasing(
    property
  )} of ${item.StateName}?`;
}

// getQuestionWithoutOrdinal returns the question without the ordinal and is
// used for the echo show.
function getQuestionWithoutOrdinal(property, item) {
  return (
    'What is the ' +
    formatCasing(property).toLowerCase() +
    ' of ' +
    item.StateName +
    '?'
  );
}

function getAnswer(property, item) {
  switch (property) {
    case 'Abbreviation':
      return `The ${formatCasing(property)} of ${
        item.StateName
      } is <say-as interpret-as='spell-out'>${item[property]}</say-as>. `;
    default:
      return `The ${formatCasing(property)} of ${item.StateName} is ${
        item[property]
      }. `;
  }
}

function getRandom(min, max) {
  return Math.floor(Math.random() * (max - min + 1) + min);
}

function askQuestion(jovo) {
  console.log('I am in askQuestion()');
  //GENERATING THE RANDOM QUESTION FROM DATA
  const random = getRandom(0, data.length - 1);
  const item = data[random];
  const propertyArray = Object.getOwnPropertyNames(item);
  const property = propertyArray[getRandom(1, propertyArray.length - 1)];

  //GET SESSION ATTRIBUTES
  const attributes = jovo.$session.$data;

  //SET QUESTION DATA TO ATTRIBUTES
  attributes.selectedItemIndex = random;
  attributes.quizItem = item;
  attributes.quizProperty = property;
  attributes.counter += 1;

  const question = getQuestion(attributes.counter, property, item);
  return question;
}

function compareSlots(slots, value) {
  for (const slot in slots) {
    if (
      Object.prototype.hasOwnProperty.call(slots, slot) &&
      slots[slot].value !== undefined
    ) {
      if (
        slots[slot].value.toString().toLowerCase() ===
        value.toString().toLowerCase()
      ) {
        return true;
      }
    }
  }

  return false;
}

function getItem(slots) {
  const propertyArray = Object.getOwnPropertyNames(data[0]);
  let slotValue;

  for (const slot in slots) {
    if (
      Object.prototype.hasOwnProperty.call(slots, slot) &&
      slots[slot].value !== undefined
    ) {
      slotValue = slots[slot].value;
      for (const property in propertyArray) {
        if (Object.prototype.hasOwnProperty.call(propertyArray, property)) {
          const item = data.filter(
            x =>
              x[propertyArray[property]].toString().toLowerCase() ===
              slots[slot].value.toString().toLowerCase()
          );
          if (item.length > 0) {
            return item[0];
          }
        }
      }
    }
  }
  return slotValue;
}

function getSpeechCon(type) {
  if (type)
    return `<say-as interpret-as='interjection'>${
      speechConsCorrect[getRandom(0, speechConsCorrect.length - 1)]
    }! </say-as><break strength='strong'/>`;
  return `<say-as interpret-as='interjection'>${
    speechConsWrong[getRandom(0, speechConsWrong.length - 1)]
  } </say-as><break strength='strong'/>`;
}

function getTextDescription(item) {
  let text = '';

  for (const key in item) {
    if (Object.prototype.hasOwnProperty.call(item, key)) {
      text += `${formatCasing(key)}: ${item[key]}\n`;
    }
  }
  return text;
}

function getAndShuffleMultipleChoiceAnswers(currentIndex, item, property) {
  return shuffle(getMultipleChoiceAnswers(currentIndex, item, property));
}

// This function randomly chooses 3 answers 2 incorrect and 1 correct answer to
// display on the screen using the ListTemplate. It ensures that the list is unique.
function getMultipleChoiceAnswers(currentIndex, item, property) {
  // insert the correct answer first
  let answerList = [item[property]];

  // There's a possibility that we might get duplicate answers
  // 8 states were founded in 1788
  // 4 states were founded in 1889
  // 3 states were founded in 1787
  // to prevent duplicates we need avoid index collisions and take a sample of
  // 8 + 4 + 1 = 13 answers (it's not 8+4+3 because later we take the unique
  // we only need the minimum.)
  let count = 0;
  let upperBound = 12;

  let seen = new Array();
  seen[currentIndex] = 1;

  while (count < upperBound) {
    let random = getRandom(0, data.length - 1);

    // only add if we haven't seen this index
    if (seen[random] === undefined) {
      answerList.push(data[random][property]);
      count++;
    }
  }

  // remove duplicates from the list.
  answerList = answerList.filter((v, i, a) => a.indexOf(v) === i);
  // take the first three items from the list.
  answerList = answerList.slice(0, 3);
  return answerList;
}

// This function takes the contents of an array and randomly shuffles it.
function shuffle(array) {
  let currentIndex = array.length,
    temporaryValue,
    randomIndex;

  while (0 !== currentIndex) {
    randomIndex = Math.floor(Math.random() * currentIndex);
    currentIndex--;
    temporaryValue = array[currentIndex];
    array[currentIndex] = array[randomIndex];
    array[randomIndex] = temporaryValue;
  }
  return array;
}

// ------------------------------------------------------------------
// CONSTANTS
// ------------------------------------------------------------------

const imagePath =
  'https://m.media-amazon.com/images/G/01/mobile-apps/dex/alexa/alexa-skills-kit/tutorials/quiz-game/state_flag/{0}x{1}/{2}._TTH_.png';
const backgroundImagePath =
  'https://m.media-amazon.com/images/G/01/mobile-apps/dex/alexa/alexa-skills-kit/tutorials/quiz-game/state_flag/{0}x{1}/{2}._TTH_.png';
const speechConsCorrect = [
  'Booya',
  'All righty',
  'Bam',
  'Bazinga',
  'Bingo',
  'Boom',
  'Bravo',
  'Cha Ching',
  'Cheers',
  'Dynomite',
  'Hip hip hooray',
  'Hurrah',
  'Hurray',
  'Huzzah',
  'Oh dear.  Just kidding.  Hurray',
  'Kaboom',
  'Kaching',
  'Oh snap',
  'Phew',
  'Righto',
  'Way to go',
  'Well done',
  'Whee',
  'Woo hoo',
  'Yay',
  'Wowza',
  'Yowsa'
];
const speechConsWrong = [
  'Argh',
  'Aw man',
  'Blarg',
  'Blast',
  'Boo',
  'Bummer',
  'Darn',
  "D'oh",
  'Dun dun dun',
  'Eek',
  'Honk',
  'Le sigh',
  'Mamma mia',
  'Oh boy',
  'Oh dear',
  'Oof',
  'Ouch',
  'Ruh roh',
  'Shucks',
  'Uh oh',
  'Wah wah',
  'Whoops a daisy',
  'Yikes'
];
const data = [
  {
    StateName: 'Alabama',
    Abbreviation: 'AL',
    Capital: 'Montgomery',
    StatehoodYear: 1819,
    StatehoodOrder: 22
  },
  {
    StateName: 'Alaska',
    Abbreviation: 'AK',
    Capital: 'Juneau',
    StatehoodYear: 1959,
    StatehoodOrder: 49
  },
  {
    StateName: 'Arizona',
    Abbreviation: 'AZ',
    Capital: 'Phoenix',
    StatehoodYear: 1912,
    StatehoodOrder: 48
  },
  {
    StateName: 'Arkansas',
    Abbreviation: 'AR',
    Capital: 'Little Rock',
    StatehoodYear: 1836,
    StatehoodOrder: 25
  },
  {
    StateName: 'California',
    Abbreviation: 'CA',
    Capital: 'Sacramento',
    StatehoodYear: 1850,
    StatehoodOrder: 31
  },
  {
    StateName: 'Colorado',
    Abbreviation: 'CO',
    Capital: 'Denver',
    StatehoodYear: 1876,
    StatehoodOrder: 38
  },
  {
    StateName: 'Connecticut',
    Abbreviation: 'CT',
    Capital: 'Hartford',
    StatehoodYear: 1788,
    StatehoodOrder: 5
  },
  {
    StateName: 'Delaware',
    Abbreviation: 'DE',
    Capital: 'Dover',
    StatehoodYear: 1787,
    StatehoodOrder: 1
  },
  {
    StateName: 'Florida',
    Abbreviation: 'FL',
    Capital: 'Tallahassee',
    StatehoodYear: 1845,
    StatehoodOrder: 27
  },
  {
    StateName: 'Georgia',
    Abbreviation: 'GA',
    Capital: 'Atlanta',
    StatehoodYear: 1788,
    StatehoodOrder: 4
  },
  {
    StateName: 'Hawaii',
    Abbreviation: 'HI',
    Capital: 'Honolulu',
    StatehoodYear: 1959,
    StatehoodOrder: 50
  },
  {
    StateName: 'Idaho',
    Abbreviation: 'ID',
    Capital: 'Boise',
    StatehoodYear: 1890,
    StatehoodOrder: 43
  },
  {
    StateName: 'Illinois',
    Abbreviation: 'IL',
    Capital: 'Springfield',
    StatehoodYear: 1818,
    StatehoodOrder: 21
  },
  {
    StateName: 'Indiana',
    Abbreviation: 'IN',
    Capital: 'Indianapolis',
    StatehoodYear: 1816,
    StatehoodOrder: 19
  },
  {
    StateName: 'Iowa',
    Abbreviation: 'IA',
    Capital: 'Des Moines',
    StatehoodYear: 1846,
    StatehoodOrder: 29
  },
  {
    StateName: 'Kansas',
    Abbreviation: 'KS',
    Capital: 'Topeka',
    StatehoodYear: 1861,
    StatehoodOrder: 34
  },
  {
    StateName: 'Kentucky',
    Abbreviation: 'KY',
    Capital: 'Frankfort',
    StatehoodYear: 1792,
    StatehoodOrder: 15
  },
  {
    StateName: 'Louisiana',
    Abbreviation: 'LA',
    Capital: 'Baton Rouge',
    StatehoodYear: 1812,
    StatehoodOrder: 18
  },
  {
    StateName: 'Maine',
    Abbreviation: 'ME',
    Capital: 'Augusta',
    StatehoodYear: 1820,
    StatehoodOrder: 23
  },
  {
    StateName: 'Maryland',
    Abbreviation: 'MD',
    Capital: 'Annapolis',
    StatehoodYear: 1788,
    StatehoodOrder: 7
  },
  {
    StateName: 'Massachusetts',
    Abbreviation: 'MA',
    Capital: 'Boston',
    StatehoodYear: 1788,
    StatehoodOrder: 6
  },
  {
    StateName: 'Michigan',
    Abbreviation: 'MI',
    Capital: 'Lansing',
    StatehoodYear: 1837,
    StatehoodOrder: 26
  },
  {
    StateName: 'Minnesota',
    Abbreviation: 'MN',
    Capital: 'St. Paul',
    StatehoodYear: 1858,
    StatehoodOrder: 32
  },
  {
    StateName: 'Mississippi',
    Abbreviation: 'MS',
    Capital: 'Jackson',
    StatehoodYear: 1817,
    StatehoodOrder: 20
  },
  {
    StateName: 'Missouri',
    Abbreviation: 'MO',
    Capital: 'Jefferson City',
    StatehoodYear: 1821,
    StatehoodOrder: 24
  },
  {
    StateName: 'Montana',
    Abbreviation: 'MT',
    Capital: 'Helena',
    StatehoodYear: 1889,
    StatehoodOrder: 41
  },
  {
    StateName: 'Nebraska',
    Abbreviation: 'NE',
    Capital: 'Lincoln',
    StatehoodYear: 1867,
    StatehoodOrder: 37
  },
  {
    StateName: 'Nevada',
    Abbreviation: 'NV',
    Capital: 'Carson City',
    StatehoodYear: 1864,
    StatehoodOrder: 36
  },
  {
    StateName: 'New Hampshire',
    Abbreviation: 'NH',
    Capital: 'Concord',
    StatehoodYear: 1788,
    StatehoodOrder: 9
  },
  {
    StateName: 'New Jersey',
    Abbreviation: 'NJ',
    Capital: 'Trenton',
    StatehoodYear: 1787,
    StatehoodOrder: 3
  },
  {
    StateName: 'New Mexico',
    Abbreviation: 'NM',
    Capital: 'Santa Fe',
    StatehoodYear: 1912,
    StatehoodOrder: 47
  },
  {
    StateName: 'New York',
    Abbreviation: 'NY',
    Capital: 'Albany',
    StatehoodYear: 1788,
    StatehoodOrder: 11
  },
  {
    StateName: 'North Carolina',
    Abbreviation: 'NC',
    Capital: 'Raleigh',
    StatehoodYear: 1789,
    StatehoodOrder: 12
  },
  {
    StateName: 'North Dakota',
    Abbreviation: 'ND',
    Capital: 'Bismarck',
    StatehoodYear: 1889,
    StatehoodOrder: 39
  },
  {
    StateName: 'Ohio',
    Abbreviation: 'OH',
    Capital: 'Columbus',
    StatehoodYear: 1803,
    StatehoodOrder: 17
  },
  {
    StateName: 'Oklahoma',
    Abbreviation: 'OK',
    Capital: 'Oklahoma City',
    StatehoodYear: 1907,
    StatehoodOrder: 46
  },
  {
    StateName: 'Oregon',
    Abbreviation: 'OR',
    Capital: 'Salem',
    StatehoodYear: 1859,
    StatehoodOrder: 33
  },
  {
    StateName: 'Pennsylvania',
    Abbreviation: 'PA',
    Capital: 'Harrisburg',
    StatehoodYear: 1787,
    StatehoodOrder: 2
  },
  {
    StateName: 'Rhode Island',
    Abbreviation: 'RI',
    Capital: 'Providence',
    StatehoodYear: 1790,
    StatehoodOrder: 13
  },
  {
    StateName: 'South Carolina',
    Abbreviation: 'SC',
    Capital: 'Columbia',
    StatehoodYear: 1788,
    StatehoodOrder: 8
  },
  {
    StateName: 'South Dakota',
    Abbreviation: 'SD',
    Capital: 'Pierre',
    StatehoodYear: 1889,
    StatehoodOrder: 40
  },
  {
    StateName: 'Tennessee',
    Abbreviation: 'TN',
    Capital: 'Nashville',
    StatehoodYear: 1796,
    StatehoodOrder: 16
  },
  {
    StateName: 'Texas',
    Abbreviation: 'TX',
    Capital: 'Austin',
    StatehoodYear: 1845,
    StatehoodOrder: 28
  },
  {
    StateName: 'Utah',
    Abbreviation: 'UT',
    Capital: 'Salt Lake City',
    StatehoodYear: 1896,
    StatehoodOrder: 45
  },
  {
    StateName: 'Vermont',
    Abbreviation: 'VT',
    Capital: 'Montpelier',
    StatehoodYear: 1791,
    StatehoodOrder: 14
  },
  {
    StateName: 'Virginia',
    Abbreviation: 'VA',
    Capital: 'Richmond',
    StatehoodYear: 1788,
    StatehoodOrder: 10
  },
  {
    StateName: 'Washington',
    Abbreviation: 'WA',
    Capital: 'Olympia',
    StatehoodYear: 1889,
    StatehoodOrder: 42
  },
  {
    StateName: 'West Virginia',
    Abbreviation: 'WV',
    Capital: 'Charleston',
    StatehoodYear: 1863,
    StatehoodOrder: 35
  },
  {
    StateName: 'Wisconsin',
    Abbreviation: 'WI',
    Capital: 'Madison',
    StatehoodYear: 1848,
    StatehoodOrder: 30
  },
  {
    StateName: 'Wyoming',
    Abbreviation: 'WY',
    Capital: 'Cheyenne',
    StatehoodYear: 1890,
    StatehoodOrder: 44
  }
];

const welcomeMessage = `Welcome to the United States Quiz Game!  You can ask me about any of the fifty states and their capitals, or you can ask me to start a quiz.  What would you like to do?`;
const startQuizMessage = `OK.  I will ask you 10 questions about the United States. `;
const exitSkillMessage = `Thank you for playing the United States Quiz Game!  Let's play again soon!`;
const repromptSpeech = `Which other state or capital would you like to know about?`;
const helpMessage = `I know lots of things about the United States.  You can ask me about a state or a capital, and I'll tell you what I know.  You can also test your knowledge by asking me to start a quiz.  What would you like to do?`;
const useCardsFlag = true;

module.exports.app = app;
