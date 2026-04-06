// Find our date picker inputs on the page
const startInput = document.getElementById('startDate');
const endInput = document.getElementById('endDate');
const gallery = document.getElementById('gallery');
const getImagesButton = document.querySelector('.filters button');

const NASA_API_KEY = 'I40rI8hl3zwbuw7tlDjw4lpgNSIIRy9eSEwDUBEz';
const APOD_URL = 'https://api.nasa.gov/planetary/apod';

// Call the setupDateInputs function from dateRange.js
// This sets up the date pickers to:
// - Default to a range of 9 days (from 9 days ago to today)
// - Restrict dates to NASA's image archive (starting from 1995)
setupDateInputs(startInput, endInput);

// Load images when the button is clicked
getImagesButton.addEventListener('click', () => {
	fetchApodImages(startInput.value, endInput.value);
});

// Show the default date range as soon as the page opens
fetchApodImages(startInput.value, endInput.value);

async function fetchApodImages(startDate, endDate) {
	if (!startDate || !endDate) {
		showMessage('Please choose both a start date and an end date.');
		return;
	}

	if (startDate > endDate) {
		showMessage('Start date must be before or the same as end date.');
		return;
	}

	showMessage('Loading space images...');

	try {
		const requestUrl = `${APOD_URL}?api_key=${NASA_API_KEY}&start_date=${startDate}&end_date=${endDate}`;
		const response = await fetch(requestUrl);

		if (!response.ok) {
			throw new Error(`API request failed with status ${response.status}`);
		}

		const data = await response.json();

		// APOD returns one object for a single day and an array for a range.
		const apodItems = Array.isArray(data) ? data : [data];

		// This project displays images only (APOD can also return videos).
		const imageItems = apodItems.filter((item) => item.media_type === 'image');

		renderGallery(imageItems);
	} catch (error) {
		showMessage('Could not load NASA images right now. Please try again.');
		console.error(error);
	}
}

function renderGallery(items) {
	if (items.length === 0) {
		showMessage('No image results found for this date range. Try different dates.');
		return;
	}

	// Show newest items first
	const sortedItems = [...items].sort((a, b) => new Date(b.date) - new Date(a.date));

	const cardsHtml = sortedItems
		.map(
			(item) => `
				<article class="gallery-item">
					<img src="${item.url}" alt="${item.title}" />
					<h2>${item.title}</h2>
					<p>${formatDate(item.date)}</p>
				</article>
			`
		)
		.join('');

	gallery.innerHTML = cardsHtml;
}

function showMessage(message) {
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
