// Use your NASA API key for this project.
const NASA_API_KEY = 'mNeUp2i6t8wxmRoX2bK3fyl5xmd347RcjGwvVcIB';
const APOD_URL = 'https://api.nasa.gov/planetary/apod';

// Mock APOD data used if the API is unavailable for testing.
const MOCK_APOD_RESPONSE = [
	{
		date: '2025-01-15',
		title: 'A Galaxy of Stars',
		explanation: 'This is sample APOD text so students can test the JSON structure when the API is down.',
		url: 'https://apod.nasa.gov/apod/image/1901/IC405_Abolfath_3952.jpg',
		media_type: 'image',
	},
];

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
	'If the Milky Way were one tennis ball wide, the Andromeda Galaxy would be around 5.6 feet away on that same scale.',
];

// Store current APOD items for modal access.
let currentApodItems = [];

// Wait for the page to be ready before reading DOM elements.
if (document.readyState === 'loading') {
	document.addEventListener('DOMContentLoaded', initializeApp);
} else {
	initializeApp();
}

function initializeApp() {
	const startInput = document.getElementById('startDate');
	const endInput = document.getElementById('endDate');
	const gallery = document.getElementById('gallery');
	const getImagesButton = document.querySelector('.filters button');
	const apodModal = document.getElementById('apodModal');
	const closeModalButton = document.getElementById('closeModalButton');

	if (!startInput || !endInput || !gallery || !getImagesButton) {
		console.error('Required page elements were not found.');
		return;
	}

	// Set date defaults and valid range using starter utility file.
	setupDateInputs(startInput, endInput);

	// Update gallery when the user clicks the button.
	getImagesButton.addEventListener('click', () => {
		fetchApodImages(startInput.value, endInput.value, gallery);
	});

	// Setup modal controls.
	closeModalButton.addEventListener('click', closeModal);
	apodModal.addEventListener('click', (event) => {
		if (event.target === apodModal) {
			closeModal();
		}
	});

	// Close modal with Escape key.
	document.addEventListener('keydown', (event) => {
		if (event.key === 'Escape' && !apodModal.classList.contains('hidden')) {
			closeModal();
		}
	});

	// Show random space fact on page load.
	showRandomSpaceFact();

	// Load NASA's latest available date, then display a 9-day default gallery.
	setDefaultRangeFromApi(startInput, endInput)
		.finally(() => {
			fetchApodImages(startInput.value, endInput.value, gallery);
		});
}

async function fetchApodImages(startDate, endDate, gallery) {
	if (!startDate || !endDate) {
		showMessage(gallery, 'Please choose both a start date and an end date.');
		return;
	}

	if (startDate > endDate) {
		showMessage(gallery, 'Start date must be before or the same as end date.');
		return;
	}

	showMessage(gallery, 'Loading space images...');

	try {
		let data;

		try {
			const requestUrl = `${APOD_URL}?api_key=${NASA_API_KEY}&start_date=${startDate}&end_date=${endDate}&thumbs=true`;
			const response = await fetch(requestUrl);

			if (!response.ok) {
				throw new Error(`API request failed with status ${response.status}`);
			}

			data = await response.json();
		} catch (apiError) {
			console.warn('Using mock APOD data because the API is unavailable.', apiError);
			data = MOCK_APOD_RESPONSE;
		}

		// Required by the task: verify API/mock payload in the console.
		console.log(data);

		const apodItems = Array.isArray(data) ? data : [data];

		// Keep only items that match the expected APOD JSON shape.
		const validApodItems = apodItems.filter(isValidApodItem);

		// Store full items for modal display.
		currentApodItems = validApodItems;

		// Build a clean image-only list so rendering is reliable.
		const imageItems = validApodItems
			.filter((item) => item.media_type === 'image' && item.url)
			.map((item) => ({
				title: item.title || 'Untitled Space Image',
				date: item.date,
				url: item.url,
				explanation: item.explanation,
			}));

		renderGallery(gallery, imageItems);
	} catch (error) {
		showMessage(gallery, 'Could not load NASA images right now. Please try again.');
		console.error(error);
	}
}

function isValidApodItem(item) {
	if (!item || typeof item !== 'object') {
		console.warn('Invalid APOD item: item is not an object.', item);
		return false;
	}

	const hasRequiredFields =
		typeof item.date === 'string' &&
		typeof item.title === 'string' &&
		typeof item.explanation === 'string' &&
		typeof item.url === 'string';

	if (!hasRequiredFields) {
		console.warn('Invalid APOD item: missing required fields (date, title, explanation, url).', item);
		return false;
	}

	return true;
}

async function setDefaultRangeFromApi(startInput, endInput) {
	try {
		const latestUrl = `${APOD_URL}?api_key=${NASA_API_KEY}`;
		const response = await fetch(latestUrl);

		if (!response.ok) {
			return;
		}

		const latestItem = await response.json();

		if (!latestItem.date) {
			return;
		}

		const latestDate = new Date(`${latestItem.date}T00:00:00`);
		const startDate = new Date(latestDate);
		startDate.setDate(startDate.getDate() - 8);

		// Keep start date inside the allowed NASA APOD range.
		const minDate = new Date(`${startInput.min}T00:00:00`);
		if (startDate < minDate) {
			startInput.value = formatInputDate(minDate);
		} else {
			startInput.value = formatInputDate(startDate);
		}

		endInput.value = formatInputDate(latestDate);
	} catch (error) {
		console.error(error);
	}
}

function renderGallery(gallery, items) {
	if (items.length === 0) {
		showMessage(gallery, 'No image results found for this date range. Try different dates.');
		return;
	}

	// Show newest images first.
	const sortedItems = [...items].sort((a, b) => new Date(b.date) - new Date(a.date));

	const cardsHtml = sortedItems
		.map(
			(item) => `
				<article class="gallery-item" data-date="${item.date}">
					<img src="${item.url}" alt="${item.title}" />
					<h2>${item.title}</h2>
					<p>${formatDate(item.date)}</p>
				</article>
			`
		)
		.join('');

	gallery.innerHTML = cardsHtml;
	addGalleryClickHandlers();
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

function openModal(apodItem) {
	const apodModal = document.getElementById('apodModal');
	const modalBody = document.getElementById('modalBody');

	const mediaMarkup = apodItem.media_type === 'image'
		? `<img class="modal-image" src="${apodItem.url}" alt="${apodItem.title}" />`
		: apodItem.thumbnail_url
			? `<img class="modal-image" src="${apodItem.thumbnail_url}" alt="Video thumbnail for ${apodItem.title}" />`
			: `<p>This APOD entry is a video. <a href="${apodItem.url}" target="_blank" rel="noopener noreferrer">Watch here</a></p>`;

	modalBody.innerHTML = `
		${mediaMarkup}
		<h2 id="modalTitle" class="modal-title">${apodItem.title}</h2>
		<p class="modal-date">${apodItem.date}</p>
		<p class="modal-explanation">${apodItem.explanation}</p>
	`;

	apodModal.classList.remove('hidden');
}

function closeModal() {
	const apodModal = document.getElementById('apodModal');
	const modalBody = document.getElementById('modalBody');

	apodModal.classList.add('hidden');
	modalBody.innerHTML = '';
}

function showRandomSpaceFact() {
	const spaceFactText = document.getElementById('spaceFactText');
	if (!spaceFactText) return;

	const randomIndex = Math.floor(Math.random() * spaceFacts.length);
	spaceFactText.textContent = spaceFacts[randomIndex];
}

function showMessage(gallery, message) {
	gallery.innerHTML = `
		<div class="placeholder">
			<div class="placeholder-icon">🔭</div>
			<p>${message}</p>
		</div>
	`;
}

function formatDate(dateString) {
	const date = new Date(`${dateString}T00:00:00`);

	return date.toLocaleDateString('en-US', {
		year: 'numeric',
		month: 'long',
		day: 'numeric',
	});
}

function formatInputDate(date) {
	return date.toISOString().split('T')[0];
}
