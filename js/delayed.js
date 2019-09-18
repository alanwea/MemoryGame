'use strict';

// IMPORTANT: See notes in styles.css for usage notes and message to reviewer

/*
Test mode is set from web page by clicking the Udacity 'U'.

Test harness is used to automate card clicks for testing.  To create debug patterns use: number = card, P = pause, 999 = sentinel. To enter the test harness, set the testHarness constant to true, click on any card on the web page.  Note that 'test mode,' entered by clicking Udacity logo, and 'test harness,' enabled here, are two different debug modes that may optionally be run concurrently.
*/
const testHarness = false;

//const testPattern = ['1','2','999']; // unmatched, in testMode will match
//const testPattern = ['1','P','1','999']; double click on same card
//const testPattern = ['1','P','2','P','2','999']; // unmatched, double click on second card
//const testPattern = ['1','P','2','P','1','999']; // unmatched, double click on first card
const testPattern = ['1','2','3','4','5','6','7','8','9','10','11','12','13','14','15','16','999']; // Test mode MUST be on for this to work: click Udacity U, then click a card. Otherwise, only two just cards will turn faceup. Tests state when all cards are matched.

// Generator stores current position in the testPattern, yields next position on each call
function* testClick(testPattern) {
	let index = 0;

	while (true) {

		if (testPattern[index] === '999') {
			console.log('END OF TEST PASS FOR ' + testPattern);
			return testPattern[index];
		}

		if (testPattern[index] === 'P') {
			console.log('<<<<<<<<<<<<<<< Test Harness Pause >>>>>>>>>>>>>>>>');
			sleep(2000);
			index++; // advance index to skip over Pause
		}

		console.log('Generator: yields ' + testPattern[index]);

		yield testPattern[index++];
	}
}

// Variable that holds the testClick generator object
var genClick = testClick(testPattern);

// guaranteed sleep for testHarness 'P': too CPU intensive for production, downloaded from the web
function sleep(ms) {
var start = Date.now(), now = start;

	while (now - start < ms) {
		now = Date.now();
	}
}
//*/

/*
Continue to initialize the game after the initial view has been displayed.
A sound context is setup to support game related event feedback.
An image object is created to hold the image used for the card faces.
A callback is created that executes after the face image has been loaded.  This is where a load delay might occur, especially if images are retrieved from a server.

When the callback triggers, the face image has been loaded and is then apportioned into sub-images that will be used for card faces.  For instance, with 16 cards the loaded image is divided into 8 subimages that are then assigned. After the remaining initialization is complete, event handlers are set up to handle card clicks bubbled to the card container, the dashboard handler, and the reset button handler.
*/

//  Called from HTML
function initializeHandlers() {

	// Retrieve game state from global object created in local storage during preload
	let mgo = JSON.parse( localStorage.getItem('FEWD: Matching Game') );

	// Retrieve the number of cards
	let cardCount = Number(mgo.rows) * Number(mgo.columns);

// TODO: intention is to store away game state if game is terminiated early, and then be able to resume game later by loading from local storage during preload.  There is some partial implementation but it is not complete.  For now, mgo.gameType will always be 'new'
	if (mgo.gameType === 'new') {
// DO THIS ONLY WHEN ITS A NEW GAME, OTHERWISE THE MASTER IMAGE THUMBNAILS WILL COME FROM THE mgo
		if (testHarness || mgo.testMode) console.log('NEW GAME INITIALIZING');

/* masterImage might hold a large image that takes a while to load. This is the primary reason that the preload code is run during web page initialization. Setup a callback function to be triggered after the master Image has loaded
*/
		let masterImage = new Image();

		masterImage.onload = function() {

		if (mgo.testMode) console.log('Loading master image');

/* Given the 'master' image, divides it into pieces ('shards') and creates a map object to hold them.  This is done so that a single large image can be apportioned into individual images for the card fronts.  Just doing it this way as a challenge and to learn canvas manipulation
*/
		mgo.imageMap = apportionMasterImage(masterImage, mgo);

// Using a map that holds cards, randomly connect card pairs to corresponding shards
		mgo.cardMap = randomizeCardsToImages(mgo);

		setFrontCardHTML(mgo);
		if (mgo.testMode) { populateHTMLClasses(mgo)} // Experimental, populate custom data in HTML

// Attach the reset event handler
		let resetButton = retrieveFirstClassValue('reset');
		resetButton.addEventListener("click", function(){resetButtonHandler(mgo)}, false);

// Attach the test mode event handler that is embedded in the logo
		let testModeButton = retrieveFirstClassValue('udacity-logo');
		testModeButton.addEventListener("click", function(){testModeHandler(mgo)});

		if (mgo.testMode) {console.log('Attaching card click event handler')};

		mgo.cardHandlerFunction = function() {cardsContainerHandler(mgo)};
		let cardsContainer = retrieveFirstClassValue('cards-container');

		cardsContainer.addEventListener("click", mgo.cardHandlerFunction, true);

		if (mgo.testMode) console.log('Finished loading master image');

		return;
	};

	// Trigger to start front image load
	masterImage.src = getMasterFrontImage();

};

// TODO	need this anymore???? return; // Important to prevent double call

};  // end of initialize handlers

// Called when card click event handler is initialized
// TODO must set stars in here too, when a reset happens
function InitCardHandler(mgo) {

	mgo.initialCard = false;  // toggle so that click event handler only calls this once
//	mgo.previousCard = '0';  // TODO need this???
//	mgo.previousFace = false; // TODO need this ???
//	mgo.clickState = 0; // TODO should be set in preload, it's 2 now, should be 0 there start state;

// Start game timer and store it in the game object
		const seconds = timerCount(true);
// Store the game timer
		mgo.gameTimerId = setInterval(showGameTimer, 1000, seconds );
// Create and store an audio context for use in accessibility and for general feedback.
		mgo.soundAlert = new AudioContext();

} // end of inital card processing

// Convenience to retrieve the card object that corresponds to a given card index
function getCardObj(cardIdx, mgo) {
	let cardObj = mgo.cardMap.get(cardIdx);
	return cardObj;
}

// Convenience to retrieve the card index given a card object
function getCardIdx(cardObj, mgo) {
	let cardIdx = cardObj.cardIdx;
	return cardIdx;
}

//
function removeHighlight(highlightClass) {

	var c = document.getElementsByClassName("blinking-red");
	console.log('highlightCards length is ' + c.length);
	while (c.length) {
		c[0].classlist.remove('blinking-red');
	}

		return;
}

// Consumes clicks and dispatches to handlers
function cardsContainerHandler(mgo) {

	// TODO: is this needed now????
	let selectedCardClass = 'card card0 back';

	// TODO: is this needed now???  Handled just below
	event.stopPropagation();

	if (testHarness) {
		console.log(`
			%%%%%%%% Test Click Received %%%%%%%%`);
//		selectedCardClass = 'card card1 back';
	} else {
		event.stopPropagation();
		selectedCardClass = event.target.classList.value;
	}

// If the card container has been clicked, but not a card, just return.
	if ( selectedCardClass === 'cards-container') { return};

	// Verify that a card has been clicked
	let isCard = (selectedCardClass.match(/\s*card\s*/) === null) ? false : true;

	// Could be more robust here, but wanted to see how assert worked
	console.assert(isCard, isCard,'Could not find card class');

	// Beginning of game setup, called once when game loads
	// TODO: should not be called when restarting an old game
	if (mgo.initialCard) {
		InitCardHandler(mgo);
	}

// Extract the card number by matching one or more digits if preceeded by 'card', 'cardxx' -> xx
	mgo.selectedCard = (selectedCardClass.match(/(?<=card)\d+/))[0];

// DEBUG TEST CLICK
// get generator function, iterate array, get next array value, make selected card the new value
	if (testHarness) {
		mgo.selectedCard = genClick.next().value;
		console.log('testHarness: generator returned ------> card = ' + mgo.selectedCard);
		if (mgo.selectedCard === '999') {
			console.log('Exiting testHarness');

//			throw "TestHarness: end of test pass";
			return;
		};
//		document.getElementById('Card' + mgo.selectedCard).click();
//		console.log('testHarness: clicking card ' + mgo.selectedCard);

//		document.getElementsByClassName('card' + mgo.selectedCard)[0].click();
	}

// END OF DEBUG TEST CLICK

// Retrieve the card object associated with the current click, and its match card object
	let selectedCardObj = mgo.cardMap.get(mgo.selectedCard);
	let matchedCardObj = mgo.cardMap.get(selectedCardObj.matchCard);

// Increment the click state - start is 0, first click is 1, second click is 2
	mgo.clickState = mgo.clickState + 1;
// looks in Q to find if current click is same as previous click
let isDoubleClick = (mgo.clickQueue.includes(mgo.selectedCard));

// If current card and and match card are both faceup, then they have already matched
	let isAlreadyMatched = (selectedCardObj.faceUp && matchedCardObj.faceUp) ? true : false;

//	if (mgo.clickState === 1) {
		mgo.clickQueue.unshift(mgo.selectedCard);
//	}

	let willMatch = ((selectedCardObj.matchCard === mgo.clickQueue[mgo.clickQueue.length-1])
		&& (mgo.clickState === 2 || mgo.clickState === 3)) ? true : false;

		console.log(
`${selectedCardObj.matchCard} : ${mgo.clickQueue[1]} : ${mgo.clickState} : ${willMatch}`
);
// Create a dispatch key
	let logicKey =
	(mgo.clickState) +
	(isAlreadyMatched ? '1' : '0') +
	(willMatch ? '1' : '0') +
	(isDoubleClick ? '1' : '0');

		console.log(`BEFORE dispatch: key(${logicKey}) state(${mgo.clickState}) card(${mgo.selectedCard}) already(${isAlreadyMatched}) will(${willMatch}) double(${isDoubleClick}) clickQ(${mgo.clickQueue})`);

// Dispatch to the handler routine
		logicMap.get(logicKey)['logic'](selectedCardObj, mgo);

		if (mgo.testMode) {	console.log('Waiting........'); }

//		mgo.clickQueue.shift();
// reset isdoubleclick, should be set on next iteration, but do it here to be consistent with console.log output that follows
	isDoubleClick = false;

//		console.log(`After: key ${logicKey}: click state(${mgo.clickState}) selected(${mgo.selectedCard}) Already (${isAlreadyMatched}) Will (${willMatch}) 2-click(${isDoubleClick}) clickQ(${mgo.clickQueue})`);
		console.log(`AFTER dispatch: key(${logicKey}) state(${mgo.clickState}) card(${mgo.selectedCard}) already(${isAlreadyMatched}) will(${willMatch}) double(${isDoubleClick}) clickQ(${mgo.clickQueue})`);

		if (testHarness) {
			let testClass = document.getElementsByClassName('card' + mgo.selectedCard)[0];
			console.log('at inserted click, class is ' + testClass);
//			let cardsContainer = retrieveFirstClassValue('cards-container');
//			cardsContainer.addEventListener("click", mgo.cardHandlerFunction, true);
//			cardsContainer.click();
			document.getElementsByClassName('cards-container')[0]
				.dispatchEvent(new MouseEvent('click'));

	}

		return;

} // End of cards container handler

//
function setFrontCardHTML(mgo) {

	for (let i=1; i<=mgo.rows * mgo.columns; i++) {
		let selector = '.front.card' + parseInt(i);
		let frontCardElement = document.querySelector(selector);
		let idx = i.toString();
		let cardObj = mgo.cardMap.get(idx);
		let imageIdx = cardObj.image;
		let image = mgo.imageMap.get(imageIdx);

		frontCardElement.src = image;
	}
}

// Blink the border by classname
// Good example of animation callbacks at https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_Animations/Using_CSS_animations
// toggleFace - turns faceup to face down
//function blinkBorder(className, CSSSelector, toggleFace,mgo) {
function blinkBorder(className, CSSSelector, blinkCount, blinkDuration, mgo) {

	let targetElement = document.querySelector(className);
	let blinkState = 1; // toggle whether to add or remove blink class

// Double Timeout design from https://dev.to/akanksha_9560/why-not-to-use-setinterval--2na9 to insure blink duration without queue race problems.
	let outerTimeout = setTimeout(

			function blinkAnimate() {
				// Determine if the class should be added or removed
				if (blinkState === 1) {
					targetElement.classList.add(CSSSelector);
				}	else {
					targetElement.classList.remove(CSSSelector);
				}

				blinkState = 3 - blinkState;

				let innerTimeout = setTimeout(blinkAnimate, blinkDuration);

				blinkCount = blinkCount - 1;

				// when animation count has run out or an external animation break has been signaled
//				console.log('blinkicount= ' + blinkCount);

				if (blinkCount < 1 /* || mgo.animationBreak */) {
					targetElement.classList.remove(CSSSelector);
					clearTimeout(innerTimeout);
					clearTimeout(outerTimeout);
	//				mgo.animationBreak = false;
	//				mgo.animationOn = false;

//					if (postProcessing) {
//						let func = new Function('mgo', postProcessing);
//						func(mgo);
//						return;
//					}
					return;
				}
			}, blinkDuration);

//		targetElement.classList.add(CSSSelector);
 console.log('returning from blink');

	return;
}


/*
const doSomething = async () => {
	await sleep(2000);
	console.log('return from sleep');
}
//*/

// Handles reset button when clicked
// Reset button has been clicked
// remove the blink - red from the allmatch, if it exisits
// show back image for all cards
// reset stars
// reset moves
// reset timer
function resetButtonHandler(mgo) {

	event.stopPropagation();
console.log('in resetButtonHandler----------------------------');
// REMOVE THE BLINK HERE
//	blinkBorder("reset", "border-blink-red", mgo);
	let targetElement = document.getElementsByClassName('reset')[0];
	// Class would exist when all cards are matched
	targetElement.classList.remove('border-blink-red');

	mgo.tally = 0;	// Set tally back to start value
	dashboardSet('tally-count', mgo.tally);

	resetStars();

	let backCollection = 	document.querySelectorAll('.back.card');
	backCollection.forEach(element => {
		element.src = mgo.cardBackImage;
	});

	mgo.cardMap = randomizeCardsToImages(mgo);

	mgo.initialCard = true;  // trigger card handler init

	return;
	// TODO need to stop timer and reset
}

// if card face is up make it down, and vice versa
function toggleFace(selectedCardObj, mgo) {
	let showFace = selectedCardObj.faceUp ? false : true;
	if (testHarness) {console.log('Card is face ' + showFace);}
	setFace(selectedCardObj, showFace, mgo);
}

// Set card face image, in test mode shard comes from in-memory image map.
function setFace(cardObj, faceUp, mgo) {

	let cardIdx = cardObj.cardIdx;  // retrieve the numeric index of card

	cardObj.faceUp = faceUp;
	mgo.cardMap.set(cardIdx, cardObj);  // Update the cardObj with new face

	if (mgo.testMode) {
		if (testHarness) {console.log('setFace: test mode and test harness are enabled #######################');}

		// update card image in RT from the image array
		if (cardObj.faceUp) {
			let base64Image = mgo.imageMap.get(cardObj.image);
			// confusing here, but in testmode the back class card src is used for both the back image and the front image retrieved from the image map
			document.querySelector('.back.card' + cardIdx).src = base64Image;
		}

		if (!cardObj.faceUp){	// faceup false, show card back
//			let backImage = mgo.cardBackImage;
			document.querySelector('.back.card' + cardIdx).src = mgo.cardBackImage;
		}

	}

	if (!mgo.testMode) { // Use card image stored in src of element

		if (cardObj.faceUp) { // faceUp true, show card front face
		// Display by swapping element properties
			document.querySelector('.back.card' + cardIdx).setAttribute('hidden', '');
			document.querySelector('.front.card' + cardIdx).removeAttribute('hidden');
		}

		if (!cardObj.faceUp){	// faceup false, show card back
			if (testHarness) console.log('setFace: faceUp(' + cardObj.faceUp +') swapping hidden attribute');
			document.querySelector('.back.card' + cardIdx).removeAttribute('hidden');
			document.querySelector('.front.card' + cardIdx).setAttribute('hidden', '');
		}
}


// KEEP THIS AND ADD IT TO TEST MODE
/*	let htmlCard = '';
	let backHtmlCard = mgo.cardBackImage;
	let frontHtmlCard = '';

	cardObj.faceUp = newFace;
	mgo.cardMap.set(cardIdx, cardObj);

 TODO  testing use of html shard v mgo shard storage
	if (imageSourceTest) {
		backHtmlCard = document.querySelector('.back.card' + cardIdx);
		frontHtmlCard = document.querySelector('.front.card' + cardIdx);
	} else {
		htmlCard = document.getElementsByClassName('card' + cardIdx)[0];
	}

	if (newFace) {
		if (imageSourceTest) {
			backHtmlCard.setAttribute('hidden', '');
			frontHtmlCard.removeAttribute('hidden');
		} else {
			htmlCard.src = mgo.imageMap.get(cardObj.image);
		}
}
	else {
		if (imageSourceTest) {
			backHtmlCard.removeAttribute('hidden');
			frontHtmlCard.setAttribute('hidden', '');
		} else {
			htmlCard.src = mgo.cardBackImage;
		}
	}
//*/

	return;
}

// Handles an event on the Udacity icon.
// From normal mode to test mode - reset everything, set back to card back image, make sure the front elements are hidden
// in test to normal:  back cards set to back image and unhidden, front card images are all set to hidden
function testModeHandler(mgo) {
//TODO remove
	console.log('testModeHandler: TEST TEST TEST TEST TEST TEST TEST TEST TEST ');

	// Turn all cards face down
	for (let i=1; i <= mgo.rows * mgo.columns; i++) {
		let cardObj = mgo.cardMap.get(i.toString());
		setFace(cardObj, false, mgo);
	}

	//toggle test mode flag
	mgo.testMode = mgo.testMode ? false : true;
	mgo.cardMap =	randomizeCardsToImages(mgo);  // testMode true suppresses randomization

	let testModeButton = document.getElementsByClassName('udacity-logo')[0];
	mgo.testMode ? testModeButton.classList.add('test-mode') : testModeButton.classList.remove('test-mode');

	mgo.initialCard = true;  // Will trigger the card handler init code on first click

	dashboardUpdateAll();

	timerCount(false);  // stop the seconds counter
	clearInterval(mgo.gameTimerId);

	mgo.tally = 0;	// Set tally back to start value
	dashboardSet('tally-count', 0);

	return;
}

// Retrieves running seconds from a generator function instead of a global
function showGameTimer(seconds) {

	let date = new Date(null);
	date.setSeconds(seconds.next().value);
	let timeString = date.toISOString().substr(14, 5);
	document.getElementsByClassName("current-timer")[0].innerHTML = timeString;

	return;
}

// Change running tally by 'value.'  For future expansion value could be negative to reward player
function updateTally(value, mgo) {
	if (testHarness) {console.log('updateTally: value(' + value + ')');}

	mgo.tally = (parseInt(mgo.tally, 10) + value).toString();
	dashboardSet('tally-count', mgo.tally);
	let starRange=[1, 3, 6];
	if (mgo.tally > starRange[0] && mgo.tally < starRange[1]) {
		dashboardSet('stars', darkStar + whiteStar + whiteStar);
	} else if (mgo.tally > starRange[1] && mgo.tally < starRange[2]) {
		dashboardSet('stars', darkStar + darkStar + whiteStar);
	} else if (mgo.tally > starRange[2]) {
		dashboardSet('stars', darkStar + darkStar + darkStar);
	}

	return mgo.tally;
};

// TODO - Reset stars
function resetStars() {
	console.log("resetStars");
	dashboardSet('stars', whiteStar + whiteStar + whiteStar);
};

function setStars(count) {
	let stars = '';
	for ( let i = 1; i<=count; i++) {
		stars = stars + darkStar;
	}

	dashboardSet('stars', stars);
	return;
}
//
function randomizeCardsToImages(mgo) {
	if (testHarness) {console.log('randomizeCardsToImages');}

	let {rows, columns, imageMap} = mgo;

	// Create a bucket of numbers representing the number of cards
	let bucket = [];
	for (let i=1; i<= rows * columns; i++) { bucket.push(i.toString());};

	let cardMap = new Map;

	// For the number of cards required, randomly select two at a time, creating an object for each that references each other, and reference the same image
	for ( let i=1, imageIdx=1; i<= rows * columns, imageIdx <= mgo.imageMap.size; i+=2, imageIdx++) {

		// Take two random numbers out of the bucket
		let firstRandomCard = getRandom(bucket).toString();
		let secondRandomCard = getRandom(bucket).toString();

			if (mgo.testMode) {  // make non-random for test mode
				firstRandomCard = i.toString();
				secondRandomCard = (i+1).toString();
			}

		// Create paired card objects that reference each other
		let cardObj = {cardIdx: firstRandomCard, matchCard: secondRandomCard, image: imageIdx.toString(), faceUp: false, isFaceUp: function() {return () => { this.faceUp;};}};
		cardMap.set(firstRandomCard, cardObj);

		cardObj = {cardIdx: secondRandomCard, matchCard: firstRandomCard, image: imageIdx.toString(), faceUp: false, isFaceUp: function() {return () => { this.faceUp;};}};
		cardMap.set(secondRandomCard, cardObj);

	}

	return cardMap;
}

// Accessibility - set alt to indicate card match state
function updateAlt(firstCard, secondCard) {
	let firstCardAlt = document.getElementsByClassName('card' + firstCard)[0].alt;

	let secondCardAlt = document.getElementsByClassName('card' + secondCard)[0].alt;

	let newFirstCardAlt = firstCardAlt + " matches " + secondCardAlt;
	let newSecondCardAlt = secondCardAlt + " matches " + firstCardAlt;

	document.getElementsByClassName('card' + firstCard)[0].alt = newFirstCardAlt;
	document.getElementsByClassName('card' + secondCard)[0].alt = newSecondCardAlt;

	return;
}

/* Guaranted delay of execution - used in animation
// Derived from https://flaviocopes.com/javascript-sleep/
// TODO:  NEED TO CHANGE THIS SO THAT IT CAN BE TERMINATED
const pause = (milliseconds) => {
		console.log('in pause(): milliseconds= ' + milliseconds);
  return new Promise(resolve => setTimeout(resolve, milliseconds))
}
//*/

/* Interruptible pause
function pauseInterrupt(milliseconds, mgo) {
	let seconds = milliseconds / 1000;
	mgo.pauseState = true;
	console.log("Start pause loop");

	for (let i=0; i<seconds; i++) {
		setTimeout(function(){console.log("in setInterval " + i);}, 5000);
		if (!mgo.pauseState) {
				console.log('break loop ' + mgo.pauseState);
			break;
		}  // If the pause is to stop then abort early
	}
	mgo.pauseState = false;
}
//*/

// Break up a large image into smaller pieces.
function apportionMasterImage(imageSource, mgo) {
	// Retrieve a card class element to use for calculations
	let card = document.getElementsByClassName('card')[0];

if (testHarness) {
		console.log(`apportionMasterImage: Card: width (${card.width}) height (${card.height})`);
	}

	let canvas = document.createElement('canvas');
	canvas.setAttribute("width", card.naturalWidth);
	canvas.setAttribute("height", card.naturalHeight);
	let ctx = canvas.getContext('2d');

	let { rows, columns} = mgo;

	let cardsNeeded = rows * columns / 2;  // Halved because each card is matched

	let frontCardWidth = imageSource.naturalWidth / columns; /* need this many images */
	let frontCardHeight = imageSource.naturalHeight / rows;

	let imageMap = new Map();

		for (let cardID=1, startX = 0, startY = 0, column = 1; cardID <= cardsNeeded; cardID++, column++) {

		if (cardID === columns + 1) { // Skip to next row after last column
			startX = 0;
			startY = frontCardHeight;
			column = 1;
		}

// Create an image shard and then convert to base64
		ctx.drawImage(imageSource, startX, startY, frontCardWidth, frontCardHeight, 0, 0, card.naturalWidth, card.naturalHeight);

		imageMap.set(cardID.toString(), canvas.toDataURL('image/jpeg'));

		ctx.clearRect(0, 0, canvas.width, canvas.height);

		startX += frontCardWidth;  // move left a card width
	}

	return imageMap;
}

// Passed an array, randomly removes one.  Zero return = empty array
// Derived from https://stackoverflow.com/questions/12987719/javascript-how-to-randomly-sample-items-without-replacement
function getRandom(bucket) {
	if (testHarness) {console.log('getRandom: bucket(' + bucket + ')');}

	let randomValue = 0;

	if (Array.isArray(bucket) && bucket.length != 0) {
		let randomPick = Math.floor(Math.random()*bucket.length);
		randomValue = bucket.splice(randomPick, 1)[0];
	}
	return randomValue;
}

// Bespoke truth table to track <cardCount> face-up cards that signal game end.  Given two card index numbers, sets corresponding bits in the table.  The table is inverted to make testing for the result easier.  That is, when all bits are set, the result is all bits unset.
let updateTT = function(mgo) {
	if (testHarness) {console.log('updateTT: ');}

//	let {truthTable, clickQueue, selectedCard} = mgo;

	mgo.truthTable |= ((1 << Number(mgo.clickQueue[1]) - 1) | (1 << Number(mgo.selectedCard) - 1));
	// Mask everything but the <cardCount> bits of the truth table
	let isAllSet = ( parseInt(~mgo.truthTable & 0x0000FFFF, 10) === 0 ) ? true : false;
	if (mgo.testMode) {
//		console.log(`updateTT: isSet(${isAllSet}) oldTT(${mgo.truthTable}) size TT(${truthTable.size})`);
	}
	return isAllSet;
}

// Simple, but annoying, beep for sound feedback
// Adapted from https://odino.org/emit-a-beeping-sound-with-javascript/
function beep(soundAlert,vol, freq, duration){
	let v = soundAlert.createOscillator();
	let u = soundAlert.createGain();
	v.connect(u);
	v.frequency.value=freq;
	v.type="square";
	u.connect(soundAlert.destination);
	u.gain.value=vol*0.01;
	v.start(soundAlert.currentTime);
	v.stop(soundAlert.currentTime+duration*0.001);
}

//*
function* timerCount(flag) {
	let count = 0;
	while (flag) {
			yield count;
			count = count + 1;
		}
}
//*/

//* Set state to newState, or if undefined, use fancy technique to toggle between 1 and 2.
function clickState(mgo, newState) {
	if (testHarness) {console.log('clickState: value(' + mgo.clickState + ')');}
	if (newState === undefined) {
	mgo.clickState = 3 - mgo.clickState;
	} else {
		mgo.clickState = newState;
	}
	return mgo.clickState;
}
//*/

function highlightBorder(cardSelector, colorClass, doHighlight, mgo) {
// find card to change highlight but without class hidden
let state = false;
	let card = document.querySelector(cardSelector);
	if (card) {
	if (doHighlight) {
		card.classList.add(colorClass);
		state = true;
	} else {
		card.classList.remove(colorClass);
	}
}
	return state;
}

// A very limited and simplistic state machine, implemented in a Map, to handle card operation logic.  The map keys correspond to a state initiated by a card container event.  Each key is mapped to related code to handle the state and determine the next state.  It's experimental and might have few advantages, except if implemented fully it would be a simple matter to write the map to local, or other, storage and restore the game in toto.
// key: 1st or 2nd click, is a match flag, will match flag, double-click flag
let logicMap = new Map([

	// First card clicked, second card clicked. The two crads are the same.
	['0001', {logic: (selectedCardObj, mgo) => {
		if (testHarness) {console.log('0001 -------------------------------> first click');}

		toggleFace(selectedCardObj, mgo);
		clickState(mgo, 0);
		mgo.clickQueue.shift();
		mgo.clickQueue.shift();
/*
//		mgo.clickQueue.shift();
*/
		return;
		}}],

	['1000', {logic: (selectedCardObj, mgo) => {
		if (testHarness) {console.log('1000 -------------------------------> first click');}

//		toggleFace(selectedCardObj, mgo);
		setFace(selectedCardObj, true, mgo);

		clickState(mgo,1);
/*
//		mgo.clickQueue.shift();
*/
		return;
		}}],

// First click
		['1001', {logic: (selectedCardObj, mgo) => {  //
			console.log('1001');

//			if (mgo.clickQueue.length < 3 ) {console.log('Err Err Err Err Err ????????????????????????????');}

			let selectedCardIdx = getCardIdx(selectedCardObj, mgo);

			if (selectedCardIdx === mgo.clickQueue[2]) { // first card, then second card, then first card selected
				setFace(selectedCardObj, false, mgo);
//				let secondCardObj = getCardObj()
				setFace(getCardObj(mgo.clickQueue[1], mgo), false, mgo);
				mgo.clickQueue.shift(); // the double-click card
				mgo.clickQueue.shift(); // the double-click card
				mgo.clickQueue.shift(); // the double-click card
				clickState(mgo, 0);

			}

			if (selectedCardIdx === mgo.clickQueue[1]) { // first card, then second card, then second card
				setFace(selectedCardObj, false, mgo);
//				setFace(getCardObj(mgo.clickQueue[1]), false, mgo);
				mgo.clickQueue.shift(); // the double-click card
				mgo.clickQueue.shift(); // the double-click card
//				mgo.clickQueue.shift(); // the double-click card
				clickState(mgo, 0);

			}

			return;
}}],

['1010', {logic: (selectedCardObj, mgo) => {  //
		console.log('1010 unknown ?????????????? ');

		return;
}}],
	/*  Future expansion
	['1011', {logic: (function() { return() => { console.log('Inside 1011 function');};})()}],

	//*/

	//* Card already matched
	['1100', {logic: (selectedCardObj, mgo) => {
		console.log('1100 already matched');

				const cardIdx = [];
				cardIdx.push(selectedCardObj.cardIdx);
				cardIdx.push(selectedCardObj.matchCard);
				logicMap.get('blink')['logic']('blinking-green', cardIdx ,mgo);

				clickState(mgo, 0);

				return;
			}
	}],
	//*/

	//*
	['1110', {logic: (selectedCardObj, mgo) => {
			console.log('1100 unknown ??????????');

//			const cardIdx = [selectedCardObj.cardIdx, selectedCardObj.matchCard];
//			logicMap.get('blink')['logic']('blinking-green', cardIdx ,mgo);

			return;
		}
	}],
	//*/

	//* Future expansion
		['1101', {logic: (function() { return() => { console.log('1101 unknown ??????????');};})()}],
		['1111', {logic: (function() { return() => { console.log('1111 unknown ??????????');};})()}],
	//*/

		// Not matched, not a double click, 2nd card click
	['2000', {'logic': (selectedCardObj, mgo) => {
		console.dir('2000 2nd click', selectedCardObj);

		setFace(selectedCardObj, true, mgo);
		updateTally(+1, mgo);
//		console.log('sleeping after setface');
//		sleep(3000);
//		setTimeout(function(){setFace(selectedCardObj, false, mgo);},3000);

//		let cardIdx = [];
//		let firstCard = mgo.clickQueue.pop();
//		mgo.clickQueue.push(firstCard);
//		cardIdx.push(firstCard);
//		cardIdx.push(selectedCardObj.cardIdx);

//		console.log('jump to blink');
//		logicMap.get('blink')['logic']('blinking-red', cardIdx ,mgo);
//		console.log('return from blink');
//		setFace(selectedCardObj, false, mgo);

//		mgo.clickQueue.shift(); // remove unmatched card from Q
/*
if (getCardIdx(selectedCardObj, mgo) == mgo.clickQueue[1]) {
	clickState(mgo, 1); // state for first card face up
	mgo.clickQueue.shift(); // the double-click card
} else {
	clickState(mgo,0); // state for waiting for first card
}
//*/

		clickState(mgo, 2);

		return;

	}}],

	//* Handle a double click on same card
	['2001', {logic: (selectedCardObj, mgo) => {
	//	let showFace = selectedCardObj.faceUp ? false : true;
	if (testHarness) {console.log('2001 -------------------------------------> double click same card');}

//		setFace(selectedCardObj, false, mgo);
		updateTally(+1, mgo);
// double click on second card - card face is now down and tally updated
// need to adjust state and queue
// how to know if second card or first card?  should be in the clickQueue

		let newCardIdx = getCardIdx(selectedCardObj, mgo);

		if(mgo.clickQueue.length === 3) { // card 1, card 2, card 1 - turn all over, cler array, reset state
			setFace(selectedCardObj, false, mgo); // turn the second card down
			let otherCardObj = getCardObj(mgo.clickQueue[1], mgo);
			setFace(otherCardObj, false, mgo); // turn the second card down
			mgo.clickQueue.shift();
			mgo.clickQueue.shift();
			mgo.clickQueue.shift();
			clickState(mgo,0);
			return;
		}

		if (mgo.clickQueue.length === 2) { // card 1, card 2, card 1 - turn all over, cler array, reset state
			if (mgo.clickQueue[0] === mgo.clickQueue[1]) { // double click on first card
				setFace(selectedCardObj, false, mgo);
				clickState(mgo,0);
				mgo.clickQueue.shift();
				mgo.clickQueue.shift(); // the double-click card
				}
		}
/*
		if (mgo.clickQueue[0] === mgo.clickQueue[1]) {
			clickState(mgo,0);
			mgo.clickQueue.shift();
			mgo.clickQueue.shift(); // the double-click card
		} else {
			if (mgo.clickQueue[0] != mgo.clickQueue[1]) { // there are two clicks in the Q and they are different
				if (newCardIdx === mgo.clickQueue[0]) {  // the new click is a duplicate of the second card
					setFace(selectedCardObj, false, mgo); // turn the second card down
					// remove it from the click queue
					clickState(mgo,1);
					mgo.clickQueue.shift(); // the double-click card
				}
			}
		}
//*/
		// if newCardIdx = Q[0] then

/*		if (getCardIdx(selectedCardObj, mgo) == mgo.clickQueue[1]) {
			clickState(mgo, 1); // state for first card face up
			mgo.clickQueue.shift(); // the double-click card
		} else {
			clickState(mgo,1); // state for waiting for first card
		}
*/

//		clickState(mgo);
//		mgo.clickQueue.shift(); // the double-click card
//		mgo.clickQueue.shift(); // the double-click card

		return;
		}
	}],
	//*/

// Cards match
// if all cards are face-up, indicate and finish game
// Using a truth table for experimental purposes
	['2010', {'logic': (selectedCardObj, mgo) => {
		console.log('2010 ----------------------------------------> cards match');
//*
		setFace(selectedCardObj, true, mgo); // turn face-up

			if (updateTT(mgo)) {
				updateTally(+1, mgo);
				logicMap.get('allMatched')['logic'](mgo);
				logicMap.get('endOfGame')['logic'](selectedCardObj, mgo);
				return;
			}

			const cardIdx = [];
			cardIdx.push(selectedCardObj.cardIdx);
			cardIdx.push(selectedCardObj.matchCard);
			logicMap.get('blink')['logic']('blinking-green', cardIdx ,mgo);

//			mgo.previousCard = selectedCardObj.cardIdx;
			updateTally(+1, mgo);
//			clickState(mgo); // toggle event ready state
			mgo.clickQueue.shift(); // pop second card off of the queue
			mgo.clickQueue.shift(); // pop second card off of the queue
			clickState(mgo,0); // set back to a start state
//		updateTT(mgo);
//*/
			return;
	//			}
			}}],

//	 future expansion
//	['2001', {logic: (function() { return() => { console.log('2001 future');};})()}],

	['2011', {logic: (function() { return() => { console.log('2011 future');};})()}],

	//*  1st card clicked on face down, 2nd card is already matched
	['2100', {logic: (selectedCardObj, mgo) => { //second, up, down, no
		console.log('2100 ------------------------------------> 1st click, 2nd up');
//		setFace(selectedCardObj, true, mgo);
	// 2nd card is already matched, and 1st card is not going to match
	// blink green the 2nd card and its match card and continue in card 1 ready state


	const cardIdx = [];
		cardIdx.push(selectedCardObj.cardIdx);
		cardIdx.push(selectedCardObj.matchCard);
		logicMap.get('blink')['logic']('blinking-green', cardIdx ,mgo);


		mgo.clickQueue.shift();
		clickState(mgo,1);

		return;
	}}],
	//*/

	// click on a card that is already face-up and matched card face-up
		['2110', {logic: (selectedCardObj, mgo) => {
			console.log('2110 -------------------------------------> up & match up');
	//		logicMap.get('blink')['logic']('blinking-green');
	return;
		}
		}],

	['2101', {logic: (selectedCardObj, mgo) => {  //
		console.log('2101 ------------------------------------> unknown');
		return;
		}}],

	['2110', {logic: (selectedCardObj, mgo) => {
		console.log('2110 -------------------------------------> already matched');
/*
			const cardIdx = [];
			cardIdx.push(selectedCardObj.cardIdx);
			cardIdx.push(selectedCardObj.matchCard);
			logicMap.get('blink')['logic']('blinking-green', cardIdx ,mgo);
*/
		return;
		}
	}],

	['3000', {logic: (selectedCardObj, mgo) => {
		console.log('3000 -------------------------------------> third click');
		setFace(selectedCardObj, true, mgo);

		setFace(getCardObj(mgo.clickQueue[1], mgo), false, mgo);
		mgo.clickQueue.shift(); // the double-click card
		mgo.clickQueue.shift(); // the double-click card
		mgo.clickQueue.unshift(getCardIdx(selectedCardObj, mgo));
		updateTally(+1, mgo);
		clickState(mgo, 2);
		/*
setFace(selectedCardObj, false, mgo);
//				let secondCardObj = getCardObj()
				setFace(getCardObj(mgo.clickQueue[1], mgo), false, mgo);
				mgo.clickQueue.shift(); // the double-click card
//*/

		return;
		}
	}],

	['3001', {logic: (selectedCardObj, mgo) => {
		console.log('3001 -------------------------------------> third click on second card - double');
		setFace(selectedCardObj, false, mgo);

		if (mgo.clickQueue[0] === mgo.clickQueue[1]) {
			mgo.clickQueue.shift(); // the double-click card
			mgo.clickQueue.shift(); // the double-click card
			clickState(mgo, 1);
		}

		if (mgo.clickQueue[0] === mgo.clickQueue[2]) {
			setFace(getCardObj(mgo.clickQueue[1], mgo), false, mgo);
//			setFace(selectedCardObj, false, mgo);
			mgo.clickQueue.shift(); // the double-click card
			mgo.clickQueue.shift(); // the double-click card
			mgo.clickQueue.shift(); // the double-click card
			clickState(mgo, 0);
		}

		//		setFace(getCardObj(mgo.clickQueue[1], mgo), false, mgo);
//		mgo.clickQueue.shift(); // the double-click card
//		mgo.clickQueue.shift(); // the double-click card
//		mgo.clickQueue.unshift(getCardIdx(selectedCardObj, mgo));
//		updateTally(+1, mgo);
		/*
setFace(selectedCardObj, false, mgo);
//				let secondCardObj = getCardObj()
				setFace(getCardObj(mgo.clickQueue[1], mgo), false, mgo);
				mgo.clickQueue.shift(); // the double-click card
//*/

		return;
		}
	}],

	['3010', {logic: (selectedCardObj, mgo) => {

		console.log('3010 ------------------------> third click match');

/*
		if (mgo.clickQueue[0] === mgo.clickQueue[1]) {
			mgo.clickQueue.shift(); // the double-click card
			mgo.clickQueue.shift(); // the double-click card
			clickState(mgo, 1);
		}
//*/

/*
		if (mgo.clickQueue[0] === mgo.clickQueue[2]) {
			setFace(getCardObj(mgo.clickQueue[1], mgo), false, mgo);
			mgo.clickQueue.shift(); // the double-click card
			mgo.clickQueue.shift(); // the double-click card
			mgo.clickQueue.shift(); // the double-click card
			clickState(mgo, 0);
		}
//*/

		setFace(getCardObj(mgo.clickQueue[1], mgo), false, mgo);
		setFace(getCardObj(mgo.clickQueue[0], mgo), true, mgo);
		mgo.clickQueue.shift();
		mgo.clickQueue.shift();
		mgo.clickQueue.unshift(getCardIdx(selectedCardObj, mgo));
		updateTally(+1, mgo);
		logicMap.get('2010')['logic'](selectedCardObj ,mgo);
		return;

//*
//	setFace(selectedCardObj, false, mgo);
//	let secondCardObj = getCardObj()
//	setFace(getCardObj(mgo.clickQueue[1], mgo), false, mgo);
//	mgo.clickQueue.shift(); // the double-click card
//*/
	}
}],


	['3101', {logic: (selectedCardObj, mgo) => {
		console.log('3101 ----------> state 0, click, state 1, click on already matched');

		const cardIdx = [];
		cardIdx.push(selectedCardObj.cardIdx);
		cardIdx.push(selectedCardObj.matchCard);
		logicMap.get('blink')['logic']('blinking-green', cardIdx ,mgo);

		setFace(selectedCardObj, false, mgo);

			mgo.clickQueue.shift(); // the double-click card
			clickState(mgo, 1);

		return;
		}
	}],
	//*
	['blink', { // Utility: blink border each card in the cardIdx array
		logic:(colorClass, cardIdx, mgo) => {
		console.log('blink ' + cardIdx[0] + ' ' + cardIdx[1]);

// This is used to differentiate between the base64 and on disk image in test mode
				let blinkFace = mgo.testMode ? '.back' : '.front';
//				setFace(mgo.cardMap.get(mgo.selectedCard), false, mgo);
				if (testHarness) console.log(cardIdx[0] + ' : ' + cardIdx[1]);


				for (let i=0; i<cardIdx.length; i++) {
					let cardSelector = '.card' + cardIdx[i] + blinkFace;

					highlightBorder(cardSelector, colorClass, true, mgo);

					blinkBorder(cardSelector, colorClass, 5, 200, mgo);
				}

				return;
			}
		}],
	//*/
		['allMatched', {logic:(mgo) => {
			if (testMode) console.log('All Matched  !!!!!!!!!!!!!!!!!');


			let cardIdxAllMatched = [];

			for (let i=1; i <= mgo.rows * mgo.columns; i++) { cardIdxAllMatched.push(parseInt(i)); }

			logicMap.get('blink')['logic']('blinking-green', cardIdxAllMatched ,mgo);

			clearInterval(mgo.gameTimerId);

			mgo.clickQueue = [];
			return;
			}
		}],

	//*
		['endOfGame', {
		logic:(selectedCardObj, mgo) => {
			if (testMode) {console.log('End of game');}

			clearInterval(mgo.gameTimerId);

			// remove the card handler so only the reset button can be pushed.
			// TODO problem here
			let handlerElement = document.getElementsByClassName('cards-container')[0];
// TODO Check if this works - doesn't seem to: in Chrome debugger, click on cards-contrainer element, look at event listener in right pane
			handlerElement.removeEventListener('click', mgo.cardHandlerFunction, true);
// TODO Starts blinking and then stops
			blinkBorder('a.reset', 'reset-blink-red', 10, 200, mgo);

		return;
		}
		}]
	//*/

	]); // end of Map

// EXPERIMENTAL: in test mode, attaches match card index to HTML element custom data attribute
function populateHTMLClasses(mgo) {
	// retrieve all card elements
	let cards = document.querySelectorAll('.card');
	// loop through them
	for (let i=0; i< cards.length; i++) {
	// get HTML element for the ith card
		let cardHTML = cards[i];
	// get the classlist
		let cardClasslist = cardHTML.classList.value;
	// look for the card index in the classlist
		let cardIdx = cardClasslist.match(/(?<=card)\d+/)[0];
	// Use the card index to retrieve the cooresponding mapped card object
		let cardObj = mgo.cardMap.get((cardIdx));
	// retrieve the card that matches the current card and set it into the 'data-match' attribute. Can be viewed by examining the card elements in the debugger
		cardHTML.setAttribute('data-match', cardObj.matchCard);
	}
	return;
}

// Returns the base64 representation of the masterImage
// Used under academic license from https://www.google.com/search?q=high+resolution+pictures+mosaic&rlz=1C1CHBD_enUS834US834&source=lnms&tbm=isch&sa=X&ved=0ahUKEwjZq9qo-6zgAhWRMX0KHZHzBdEQ_AUIDigB&biw=920&bih=483#imgrc=-NIsMd9cV19d4M:
function getMasterFrontImage() {
	return "data:image/jpeg;base64,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";
	}
