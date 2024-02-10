let webstore = new Vue({
  el: "#app",
  data: {
    sitename: "M00961778 - Course Work 2",
    lessons: [],
    searchQuery: "",
    sortBy: "",
    sortOrder: "asc",
    showCartPage: true,
    order: {
      name: "",
      number: "",
    },
    cart: [],
    query: "",
    searchResults: [],
  },

  mounted() {
    // Fetch lessons when the component is mounted
    this.fetchLessons();
  },

  computed: {
    cartItemCount() {
      return this.cart.length;
    },

    // Function to allow Placing Order
    canCheckOut() {
      return this.order.name !== "" && this.order.number !== "";
    },

    // function to enable checkout button
    enableCheckout() {
      return this.cart.length > 0;
    },
  },
  methods: {
    addToCart(lesson) {
      this.cart.push(lesson._id);
    },

    canAddToCart(lesson) {
      return lesson.spaces > this.cartCount(lesson._id);
    },

    cartCount(id) {
      let count = 0;
      for (let i = 0; i < this.cart.length; i++) {
        if (this.cart[i] === id) {
          count++;
        }
      }
      return count++;
    },

    fetchLessons() {
      // Fetch lessons from the server
      fetch(
        "https://products-env.eba-gpri3t2b.eu-north-1.elasticbeanstalk.com/collection/products",
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        }
      )
        .then((response) => response.json())
        .then((responseJSON) => {
          // Update the lessons data with the fetched lessons
          this.lessons = responseJSON;
        })
        .catch((error) => {
          console.error("Error fetching lessons:", error);
        });
    },

    // function to show cart page
    toggleCartPage() {
      this.showCartPage = !this.showCartPage;
    },

    // Function to remove from Cart
    removeFromCart(index) {
      const removedLesson = this.cart.splice(index, 1)[0];
      const originalLessonIndex = this.lessons.findIndex(
        (item) => item._id === removedLesson._id
      );

      if (originalLessonIndex !== -1) {
        this.lessons.splice(originalLessonIndex, 0, removedLesson);
      }
    },

    // Function to know the lesson that was removed from cart
    getLessonDetails(lessonId) {
      return this.lessons.find((lesson) => lesson._id === lessonId);
    },

    async submitOrder() {
      try {
        // Save the new order
        const savedOrder = await this.saveOrder();

        // Calculate total quantity of each lesson in the cart
        const quantityMap = {};
        this.cart.forEach((cartItem) => {
          const lessonId = cartItem.lesson ? cartItem.lesson._id : cartItem;
          quantityMap[lessonId] = (quantityMap[lessonId] || 0) + 1; // Increment quantity for each lessonId
        });

        // Update lesson space after the order is saved
        for (const [lessonId, quantity] of Object.entries(quantityMap)) {
          try {
            // Make an API request to fetch originalSpaces from the server
            const response = await fetch(
              `http://products-env.eba-gpri3t2b.eu-north-1.elasticbeanstalk.com/collection/products/${lessonId}`
            );
            if (!response.ok) {
              throw new Error("Failed to fetch originalSpaces");
            }
            const lessonDetails = await response.json();
            const originalSpaces = lessonDetails.spaces;

            // Pass the original spaces as a parameter
            this.updateLessonSpace(lessonId, quantity, originalSpaces);

            this.order = {
              name: "",
              number: "",
            };
            this.cart = [];
          } catch (error) {
            console.error("Error fetching originalSpaces:", error);
          }
        }
        console.log("Order placed successfully");
        // Redirect or show success message to the user
      } catch (error) {
        console.error("Failed to place order:", error);
        // Show error message to the user
      }
    },

    // Function to save a new order
    async saveOrder() {
      const orderData = { order: this.order, cart: this.cart };
      try {
        const response = await fetch(
          "http://products-env.eba-gpri3t2b.eu-north-1.elasticbeanstalk.com/collection/orders",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify(orderData),
          }
        );
        if (!response.ok) {
          throw new Error("Failed to save order");
        }
        const responseData = await response.json();
        console.log("New order saved:", responseData);

        return responseData; // Return the saved order data if needed
      } catch (error) {
        console.error("Error saving order:", error);
        throw error; // Rethrow the error for error handling at the caller side
      }
    },

    // Function to update available lesson space
    async updateLessonSpace(lessonId, quantity, originalSpaces) {
      try {
        const response = await fetch(
          `http://products-env.eba-gpri3t2b.eu-north-1.elasticbeanstalk.com/collection/products/${lessonId}`,
          {
            method: "PUT",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              // Assuming you have a property like 'spaces' in the lesson data
              // Adjust the property name according to your data structure
              spaces: originalSpaces - quantity, // originalSpaces is the initial spaces
            }),
          }
        );
        if (!response.ok) {
          throw new Error("Failed to update lesson space");
        }
        console.log("Lesson space updated");
      } catch (error) {
        console.error("Error updating lesson space:", error);
        throw error; // Rethrow the error for error handling at the caller side
      }
    },
  },

  watch: {
    async query(newValue) {
      try {
        const response = await fetch(
          `http://products-env.eba-gpri3t2b.eu-north-1.elasticbeanstalk.com/search?query=${newValue}`
        );
        if (!response.ok) {
          throw new Error("Failed to fetch search results");
        }
        this.searchResults = await response.json();
      } catch (error) {
        console.error("Error searching lessons:", error);
        // Handle error (e.g., display error message)
        this.searchResults = [];
      }
    },
  },
});
