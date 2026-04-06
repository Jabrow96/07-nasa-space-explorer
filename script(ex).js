// Find our date picker inputs on the page
const startInput = document.getElementById('startDate');
const endInput = document.getElementById('endDate');
const getImagesButton = document.querySelector('.filters button');
const gallery = document.getElementById('gallery');
const spaceFactText = document.getElementById('spaceFactText');
const apodModal = document.getElementById('apodModal');
const modalBody = document.getElementById('modalBody');
const closeModalButton = document.getElementById('closeModalButton');

// Paste your own NASA API key between the quotes below.
// Keep DEMO_KEY as a fallback while testing.
const myNasaApiKey = 'DF5ZhRSgCYmmvuZpeFPRBVezCz8Rn6GOryKVPMDB';
const apiKey = myNasaApiKey || 'DEMO_KEY';
const baseUrl = 'https://api.nasa.gov/planetary/apod';
let currentApodItems = [];

// Store facts in an array so we can randomly pick one each refresh.
const spaceFacts = [
	'It would take nine years to walk to the Moon.',
	'Mars is called the Red Planet because iron oxide (rust) gives its surface a red color.',
	"Mercury's temperature ranges from about -280 F at night to 800 F during the day.",
	'If you can see the Andromeda Galaxy with your naked eye, you are looking about 14.7 billion billion miles away.',
	'The Sun is around 400 times wider than the Moon and about 400 times farther away, so they look similar in size from Earth.',
	'Jupiter is the largest planet and could fit the other seven planets inside about 70% of its volume.',
	'Stars do not twinkle until their light passes through Earth\'s atmosphere.',
	'If Earth were the size of a tennis ball, the Sun would be about 24 feet across and about half a mile away.',
	'Of the 9,113 official named features on the Moon, only 421 are not craters.',
	'Driving at 70 mph to the nearest star would take more than 356 billion years.',
	"Neptune's moon Triton is the coldest known object in our solar system, averaging about -391 F.",
	"When the Moon is at first or last quarter, it is only about 10% as bright as the full Moon.",
	'The earliest stars likely formed about 200 million years after the Big Bang.',
	"Jupiter's Great Red Spot is an anticyclonic storm near 22 degrees south latitude and rotates roughly every six days.",
	'If you could jump into a tunnel through Earth, you would reach the other side in about 42 minutes and 12 seconds.',
	"To escape Earth's gravity, a spacecraft must travel more than 25,008 mph (about Mach 33).",
	'Light from a star 31.7 light-years away takes about 1 billion seconds to reach Earth.',
	'The International Space Station orbits Earth roughly every 90 minutes.',
	"Venus is the hottest planet, with cloud-trapped heat pushing temperatures to about 863 F.",
	'If the Milky Way were one tennis ball wide, the Andromeda Galaxy would be around 5.6 feet away on that same scale.'
];

// Call the setupDateInputs function from dateRange.js
// This sets up the date pickers to:
// - Default to a range of 9 days (from 9 days ago to today)
// - Restrict dates to NASA's image archive (starting from 1995)
setupDateInputs(startInput, endInput);

function showRandomSpaceFact() {
	const randomIndex = Math.floor(Math.random() * spaceFacts.length);
	spaceFactText.textContent = spaceFacts[randomIndex];
}

// Show a simple loading message while we wait for the API response.
function showLoadingMessage() {
	gallery.innerHTML = `
		<div class="placeholder">
			<div class="placeholder-icon">🛰️</div>
			<p>Loading space images...</p>
		</div>
	`;
}

// Show reusable messages (errors, validation notices, etc.).
function showMessage(message) {
	gallery.innerHTML = `
		<div class="placeholder">
			<div class="placeholder-icon">⚠️</div>
			<p>${message}</p>
		</div>
	`;
}

// Convert one APOD object into a gallery card.
function createGalleryCard(apodItem) {
	// APOD sometimes returns videos instead of images.
	// We use NASA thumbnail support when available.
	const mediaMarkup = apodItem.media_type === 'image'
		? `<img src="${apodItem.url}" alt="${apodItem.title}" />`
		: apodItem.thumbnail_url
			? `<img src="${apodItem.thumbnail_url}" alt="Video thumbnail for ${apodItem.title}" />`
			: `<div class="video-thumbnail">Video APOD</div>`;

	return `
		<article class="gallery-item" data-date="${apodItem.date}">
			${mediaMarkup}
			<p><strong>${apodItem.title}</strong> (${apodItem.date})</p>
		</article>
	`;
}

function closeModal() {
	apodModal.classList.add('hidden');
	modalBody.innerHTML = '';
}

function openModal(apodItem) {
	const modalMediaMarkup = apodItem.media_type === 'image'
		? `<img class="modal-image" src="${apodItem.hdurl || apodItem.url}" alt="${apodItem.title}" />`
		: `<p>This APOD entry is a video. <a href="${apodItem.url}" target="_blank" rel="noopener noreferrer">Watch here</a></p>`;

	modalBody.innerHTML = `
		${modalMediaMarkup}
		<h2 id="modalTitle" class="modal-title">${apodItem.title}</h2>
		<p class="modal-date">${apodItem.date}</p>
		<p class="modal-explanation">${apodItem.explanation}</p>
	`;

	apodModal.classList.remove('hidden');
}

function addGalleryClickHandlers() {
	const cards = document.querySelectorAll('.gallery-item');

	cards.forEach((card) => {
		card.addEventListener('click', () => {
			const selectedDate = card.dataset.date;
			const selectedItem = currentApodItems.find((item) => item.date === selectedDate);

			if (selectedItem) {
				openModal(selectedItem);
			}
		});
	});
}

// Fetch APOD entries for the date range and render them in the gallery.
async function fetchAndDisplayApodRange() {
	const startDate = startInput.value;
	const endDate = endInput.value;

	if (!startDate || !endDate) {
		showMessage('Please select both a start date and an end date.');
		return;
	}

	if (endDate < startDate) {
		showMessage('End date must be the same as or after the start date.');
		return;
	}

	showLoadingMessage();

	try {
		const url = `${baseUrl}?api_key=${apiKey}&start_date=${startDate}&end_date=${endDate}&thumbs=true`;
		const response = await fetch(url);

		if (!response.ok) {
			throw new Error(`Request failed with status ${response.status}`);
		}

		const data = await response.json();

		if (!Array.isArray(data) || data.length === 0) {
			showMessage('No images found for this date range. Try a different range.');
			return;
		}

		// Show most recent entries first.
		const sortedData = data.sort((a, b) => new Date(b.date) - new Date(a.date));
		currentApodItems = sortedData;
		gallery.innerHTML = sortedData.map((item) => createGalleryCard(item)).join('');
		addGalleryClickHandlers();
	} catch (error) {
		showMessage('Could not load NASA data right now. Please try again in a moment.');
		console.error('APOD fetch error:', error);
	}
}

// Run the API call when the user clicks the button.
getImagesButton.addEventListener('click', fetchAndDisplayApodRange);
closeModalButton.addEventListener('click', closeModal);

// Close when clicking outside the modal content.
apodModal.addEventListener('click', (event) => {
	if (event.target === apodModal) {
		closeModal();
	}
});

// Close with the Escape key for accessibility.
document.addEventListener('keydown', (event) => {
	if (event.key === 'Escape' && !apodModal.classList.contains('hidden')) {
		closeModal();
	}
});

// Show one random fact whenever the page is loaded/refreshed.
showRandomSpaceFact();
