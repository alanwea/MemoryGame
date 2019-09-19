'use strict';

/*
	Future development:
		The current Memory Game Object 	http://2ality.com/2012/01/objects-as-maps.html
*/

const darkStar = "&#x02605";
const whiteStar = "&#x02606";
const semicircleArrow = "&#x21bb";

/*
A template literal used to define HTML that will be injected for each card image element during initial page load.
Arrow syntax is used to defer resolution of the parameters until used below at runtime.
Change the template here to change the injected HTML.
TODO add tabindex=0 for accessibility.
Template definition for front and back of card.  Backimage is used for both to begin.  The front will be filled in by the code in delayed.js when it is decided whether the base64 embedded images will used from within the JS, or written out to each element.
*/
function initializeGame(rows, columns) {

	var htmlTemplate = (cardNumber, backImage) => `<img class='card card${cardNumber} back' data-match='00'  src='${backImage}' alt='Card ${cardNumber}'>
	<img hidden class='card card${cardNumber} front' data-match='00' src='${backImage}' alt='Card ${cardNumber}'>`;

/* TODO need to fix this create function and then fill values model, or add a note why I am doing it this way.
Memory Game Object(mgo) where the state of the game is stored.  Note: some pundits say map should be used instead, I chose an Object for experience, as I use a map elsewhere.
REMEMBER TO INITIALIZE VALUES IN BODY OF ROUTINE OR THEY WON'T SHOW UP IN OBJECT */
	var mgo = function() {
		let tally = 0;
		let gameType = "";
//		let gameDate = 0;
		let rows = 0;
		let columns = 0;

		let cardBackImage = "";
		let cardFrontImage = "";

		let imageMap = {};
		let cardMap = {};

		let selectedCard = '0';
		let initialCard = true;
		let gameTimer = 0;
		let gameTimerId = 0;
		let soundAlert = 0;
		let truthTable = 0;
		let clickQueue = [];

		let cardHandlerFunction = '';

		let clickState = 2; // TODO set to 0 instead????

		let testMode = false;  // used to indicate test mode when Udacity logo is clicked

//		let pauseState = false;

	return {
		}
	}();

// Date manipulation background provided by https://www.toptal.com/software/definitive-guide-to-datetime-manipulation

//mgo.gameType = 'new';
//mgo.gameDate = new Date();

/*  localStorage is used to maintain game state and so there is a check to find out if localStorage exists, but if it doesn't the error handling is to simply inform the player and exit.  If this were a production implementation, a better design would be to inform the player that the game cannot be saved and then ask if the player would like to contiue.  Then instead of using localStorage and alternative way of passing the game state object would need to be used. */

	try {
		isStorageAvailable('localStorage');
//		console.log(`Checked for localStorage and found it`);
		/*
			Check localStorage to see if a previous game exists and load it into mgo if it does.

		 */
		let mgo = JSON.parse( localStorage.getItem('XFEWD: Matching Game'));

		if (mgo != null) {
			if (confirm(`A previous saved game exists, do you want to continue it?`)) {
					return;  // Do not initialize mgo, just continue with previous game
			}
		} else {
	}
}
	catch(err) {
		if (!confirm('Insufficient space to save game state.  Continue anyway?')) {
			return;
		} else {
			/* Set up game to use a different method of passing the game state to other modules */
		}
	}

	// retrieve the image location of the card back
	let cardBackImage = retrieveFirstClassValue('card-back-image').innerHTML;

	// Generate HTML for the cards using the card back image
	let generatedHTML = (function generateHTML(htmlTemplate, cardBackImage, cardCount) {
		let s = '';
		for (let i=1; i <= cardCount; i++) {
			s+= htmlTemplate(i, cardBackImage);
		}
		return s;
	}(htmlTemplate, cardBackImage, rows * columns ));

//	document.getElementsByClassName('cards-container')[0].innerHTML = generatedHTML;
// Does a bulk insert into the HTML of all the cards that were generated from the template
retrieveFirstClassValue('cards-container').innerHTML = generatedHTML;

		mgo.gameType = 'new';
		mgo.rows = rows;
		mgo.columns = columns;
		mgo.tally = 0;
		mgo.initialCard = true;  // used to do pre-init in the card click handler
		mgo.selectedCard = '0';  // contains the current card clicked
		mgo.gameTimerId = 0;
		mgo.gameTimer = 0;
		mgo.soundAlert = 0; // holds the AudioContext
		mgo.truthTable = 0; // tracks faceup cards to determine end of game
		mgo.imageMap = new Map; // maps face card image shards
		mgo.cardMap = new Map; // maps card objects
		mgo.cardBackImage = cardBackImage;  // holds the URI reference to the card back image
		mgo.clickQueue = []; // // The clickQueue contains up to the last three selected cards.
		mgo.cardHandlerFunction = '';
		mgo.clickState = 0;	// initial state set in card click handler
		mgo.testMode = false;
//		mgo.pauseState = false;  // used to terminate a pause early

		if (rows * columns % 2 != 0) {  // Is cardCount even?
			cleanUpandExit('cardCount is not even, terminiate');
		};

		dashboardUpdateAll(); /* initialize stars, moves, reset and timer to initial values */

		// Store the start state of the new game in localStorage
		localStorage.setItem('FEWD: Matching Game', JSON.stringify(mgo));
	}

// Set all dashboard elements to initial values
function dashboardUpdateAll() {
		dashboardSet('stars', whiteStar + whiteStar + whiteStar);
		dashboardSet('tally', 0);
		dashboardSet('reset', semicircleArrow);
		document.getElementsByClassName('current-timer')[0].innerHTML = "00:00";
}

// Given a class name for a dashboard element, sets the innerHTML to desired value
function dashboardSet(dashboardClass, value) {

// example of try..catch to show that I know about it
try {

		let dashboardElement = retrieveFirstClassValue(dashboardClass);
		dashboardElement.innerHTML = ' ';
		dashboardElement.innerHTML = value;
	}
	catch(err) {
		cleanUpandExit("??? Unable to find the '" + dashboardClass + "' class", err);
	}
}

/*
Given a className, that potentially returns multiple elements, returns just the first.  Also shows another example of a try...catch for error handling
*/
function retrieveFirstClassValue(className) {

	try {
		let firstClassValue = document.getElementsByClassName(className)[0];
		return firstClassValue;
		}
		catch(err) {
			cleanUpandExit(`Unable to find HTML class ${className}. Error ${err}`);
		}
}

// TODO:  minimal.  Used only if an error in this file
function cleanUpandExit(arg) {
	console.log(arg);
}

/* Check if localStorage is available and ready for use.
 Borrowed from (except for "let"s) from https://developer.mozilla.org/en-US/docs/Web/API/Web_Storage_API/Using_the_Web_Storage_API
*/
 function isStorageAvailable(type) {
	try {
			let storage = window[type];
			let x = '__storage_test__';
			storage.setItem(x, x);
			storage.removeItem(x);
			return true;
	}
	catch(e) {
			return e instanceof DOMException && (
					// everything except Firefox
					e.code === 22 ||
					// Firefox
					e.code === 1014 ||
					// test name field too, because code might not be present
					// everything except Firefox
					e.name === 'QuotaExceededError' ||
					// Firefox
					e.name === 'NS_ERROR_DOM_QUOTA_REACHED') &&
					// acknowledge QuotaExceededError only if there's something already stored
					(storage && storage.length !== 0);
	}
}
