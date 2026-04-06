// Put your NASA API key here for this app.
const NASA_API_KEY = 'mNeUp2i6t8wxmRoX2bK3fyl5xmd347RcjGwvVcIB';
const APOD_URL = 'https://api.nasa.gov/planetary/apod';

// Fallback APOD sample used when the live API cannot be reached.
const MOCK_APOD_RESPONSE = [
	{
		date: '2025-01-15',
		title: 'A Galaxy of Stars',
		explanation: 'This is sample APOD text so students can test the JSON structure when the API is down.',
		url: 'https://apod.nasa.gov/apod/image/1901/IC405_Abolfath_3952.jpg',
		media_type: 'image',
	},
];

// Keep facts in a list so one can be chosen at random each time.
const spaceFacts = [
  "Mars looks red because its dusty surface contains iron oxide, which is basically rust.",
	"On Mercury, temperatures can swing from around -280 F at night to near 800 F in daylight.",
	'When you spot Andromeda with the naked eye, you are seeing light from about 14.7 quintillion miles away.',
	'The Sun is about 400 times wider than the Moon and also about 400 times farther away, which is why they appear close in size in our sky.',
	"Jupiter is so large that all seven other planets could fit inside it with room to spare.",
  "Triton, Neptune's largest moon, is one of the coldest known worlds at around -391 F.",
	"At first or last quarter, the Moon is only about one-tenth as bright as a full Moon.",
  'Light that takes 1 billion seconds to arrive comes from about 31.7 light-years away.',
	'The International Space Station circles Earth in about an hour and a half.',
	"Venus is the hottest planet in our solar system, with average surface temperatures near 863 F.",
	'If the Milky Way were scaled to one tennis ball, Andromeda would be about 5.6 feet away on that same model.',
	'Walking nonstop to the Moon at a normal pace would take roughly nine years.',
	'The first generation of stars probably formed around 200 million years after the Big Bang.',
	"Jupiter's Great Red Spot is a giant high-pressure storm near 22 degrees south that spins about once every six days.",
	"In a straight tunnel through Earth, the trip from one side to the other would take about 42 minutes.",
	"A spacecraft needs to exceed about 25,000 mph to escape Earth's gravity without additional thrust.",
	"Stars seem to twinkle because Earth's atmosphere bends their light.",
	'If Earth were shrunk to a tennis ball, the Sun would be about 24 feet wide and roughly half a mile away.',
	'Most named lunar surface features are craters; only a small fraction have other shapes.',
	'Driving 70 mph to the nearest star beyond the Sun would still take over 356 billion years.',
];

// Save the current APOD records so the modal can open them.
let currentApodItems = [];

// Wait until the document is ready before querying page elements.
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

	// Apply default dates and allowed limits using the helper file.
	setupDateInputs(startInput, endInput);

	// Refresh the gallery after the user clicks the button.
	getImagesButton.addEventListener('click', () => {
		fetchApodImages(startInput.value, endInput.value, gallery);
	});

	// Configure modal open/close controls.
	closeModalButton.addEventListener('click', closeModal);
	apodModal.addEventListener('click', (event) => {
		if (event.target === apodModal) {
			closeModal();
		}
	});

	// Let users close the modal by pressing Escape.
	document.addEventListener('keydown', (event) => {
		if (event.key === 'Escape' && !apodModal.classList.contains('hidden')) {
			closeModal();
		}
	});

	// Display one random space fact when the page loads.
	showRandomSpaceFact();

	// Pull NASA's latest date, then load the default 9-day gallery.
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

		// Assignment check: print API or mock payload in the console.
		console.log(data);

		const apodItems = Array.isArray(data) ? data : [data];

		// Keep only entries that match the expected APOD JSON fields.
		const validApodItems = apodItems.filter(isValidApodItem);

		// Keep full entries so the modal can show all details.
		currentApodItems = validApodItems;

		// Build an image-only list to keep gallery rendering predictable.
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

		// Make sure the start date stays within NASA's valid APOD range.
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

	// Display the newest images at the top.
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
