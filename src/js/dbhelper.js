/**
 * Common database helper functions.
 */

/* global google, Dexie */
/* exported DBHelper */
const db = new Dexie('restaurant_reviews');
db.version(1).stores({
	restaurants: '&id,cuisine_type,neighborhood'
});

class DBHelper {

	/**
	 * Database URL.
	 * Change this to restaurants.json file location on your server.
	 */
	static get DATABASE_URL() {
		const port = 1337; // Change this to your server port
		return `http://localhost:${port}/restaurants/`;
	}

	/**
	 * Fetch all restaurants.
	 */
	static fetchRestaurants(callback) {
		db.restaurants.orderBy('id').toArray()
			.then(function(arr) {
				if(arr.length) {
					callback(null, arr);
				}
				else {
					fetch(DBHelper.DATABASE_URL)
						.then(function(response) {
							if(response.status === 200)
								return response.json();
							else
								callback(`Request failed. Returned status of ${response.status}`, null);
						})
						.then(function(json) {
							db.restaurants.bulkAdd(json);
							callback(null, json);
						})
						.catch(function(error) {
							callback(`Request failed. Returned error: ${error}`, null);
						});
				}
			});
	}

	/**
	 * Fetch a restaurant by its ID.
	 */
	static fetchRestaurantById(id, callback) {
		// fetch all restaurants with proper error handling.
		db.restaurants.get(id).then(function(restaurant) {
			if(restaurant)
				callback(null, restaurant);
			else {
				DBHelper.fetchRestaurants((error, restaurants) => {
					if (error) {
						callback(error, null);
					} else {
						const restaurant = restaurants.find(r => r.id == id);
						if (restaurant) { // Got the restaurant
							callback(null, restaurant);
						} else { // Restaurant does not exist in the database
							callback('Restaurant does not exist', null);
						}
					}
				});
			}
		});
	}

	/**
	 * Fetch restaurants by a cuisine type with proper error handling.
	 */
	static fetchRestaurantByCuisine(cuisine, callback) {
		// Fetch all restaurants  with proper error handling
		db.restaurants.filter(r => r.cuisine_type == cuisine).toArray().then(function(restaurants) {
			if(restaurants.length) {
				callback(null, restaurants);
			}
			else {
				DBHelper.fetchRestaurants((error, restaurants) => {
					if (error) {
						callback(error, null);
					} else {
						// Filter restaurants to have only given cuisine type
						const results = restaurants.filter(r => r.cuisine_type == cuisine);
						callback(null, results);
					}
				});
			}
		}).catch(e => console.error(e));
	}

	/**
	 * Fetch restaurants by a neighborhood with proper error handling.
	 */
	static fetchRestaurantByNeighborhood(neighborhood, callback) {
		// Fetch all restaurants
		db.restaurants.filter(r => r.neighborhood == neighborhood).toArray().then(function(restaurants) {
			if(restaurants.length) {
				callback(null, restaurants);
			}
			else {
				DBHelper.fetchRestaurants((error, restaurants) => {
					if (error) {
						callback(error, null);
					} else {
						// Filter restaurants to have only given cuisine type
						const results = restaurants.filter(r => r.cuisine_type == neighborhood);
						callback(null, results);
					}
				});
			}
		}).catch(e => console.error(e));
	}

	/**
	 * Fetch restaurants by a cuisine and a neighborhood with proper error handling.
	 */
	static fetchRestaurantByCuisineAndNeighborhood(cuisine, neighborhood, callback) {
		// Fetch all restaurants
		DBHelper.fetchRestaurants((error, restaurants) => {
			if (error) {
				callback(error, null);
			} else {
				let results = restaurants;
				if (cuisine != 'all') { // filter by cuisine
					results = results.filter(r => r.cuisine_type == cuisine);
				}
				if (neighborhood != 'all') { // filter by neighborhood
					results = results.filter(r => r.neighborhood == neighborhood);
				}
				callback(null, results);
			}
		});
	}

	/**
	 * Fetch all neighborhoods with proper error handling.
	 */
	static fetchNeighborhoods(callback) {
		// Fetch all restaurants
		DBHelper.fetchRestaurants((error, restaurants) => {
			if (error) {
				callback(error, null);
			} else {
				// Get all neighborhoods from all restaurants
				const neighborhoods = restaurants.map((v, i) => restaurants[i].neighborhood);
				// Remove duplicates from neighborhoods
				const uniqueNeighborhoods = neighborhoods.filter((v, i) => neighborhoods.indexOf(v) == i);
				callback(null, uniqueNeighborhoods);
			}
		});
	}

	/**
	 * Fetch all cuisines with proper error handling.
	 */
	static fetchCuisines(callback) {
		// Fetch all restaurants
		DBHelper.fetchRestaurants((error, restaurants) => {
			if (error) {
				callback(error, null);
			} else {
				// Get all cuisines from all restaurants
				const cuisines = restaurants.map((v, i) => restaurants[i].cuisine_type);
				// Remove duplicates from cuisines
				const uniqueCuisines = cuisines.filter((v, i) => cuisines.indexOf(v) == i);
				callback(null, uniqueCuisines);
			}
		});
	}

	/**
	 * Restaurant page URL.
	 */
	static urlForRestaurant(restaurant) {
		return (`./restaurant.html?id=${restaurant.id}`);
	}

	/**
	 * Restaurant image URL.
	 */
	static imageUrlForRestaurant(restaurant) {
		let url = `/img/${restaurant.photograph}`;
		return [`${url}_200.jpg 200w`, `${url}_554.jpg 554w`, `${url}_800.jpg 800w`];
	}

	/**
	 * Map marker for a restaurant.
	 */
	
	static mapMarkerForRestaurant(restaurant, map) {
		const marker = new google.maps.Marker({
			position: restaurant.latlng,
			title: restaurant.name,
			url: DBHelper.urlForRestaurant(restaurant),
			map: map,
			animation: google.maps.Animation.DROP}
		);
		return marker;
	}

}
