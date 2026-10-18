# Project Title

Concurrency Factory

Concurrency Factory is an interactive web application that teaches concurrency concepts such as threads, queues, race conditions, locks, and semaphores. Users can step through simulations, make predictions, edit example programs, and observe how their changes affect the results.

## Instructions for Build and Use

Steps to build and/or run the software:

1. Open a terminal in the `concurrency-factory` project folder.
2. Install the dependencies:

   ```bash
   npm install
   ```

3. Start the development server:

   ```bash
   npm run dev
   ```

4. Open the local URL provided by Vite in a web browser.

To create a production build, run:

```bash
npm run build
```

Instructions for using the software:

1. Select a lesson from the lesson navigation.
2. Read each section and make a prediction when prompted.
3. Use the controls to step through the factory simulation.
4. Try the guided experiments by changing values such as workers, packages, permits, or counter operations.
5. Review the execution history and results.
6. Complete the final understanding check and move to the next lesson.

## Development Environment

To recreate the development environment, you need the following software and libraries:

* Node.js
* React 19.3.0
* React DOM 19.3.0
* TypeScript 6.0.3
* Vite 8.3.2
* A modern web browser such as Chrome, Edge, Firefox, or Safari

## Useful Websites to Learn More

I found these websites useful in developing this software:

* [React Documentation](https://react.dev/)
* [Vite Documentation](https://vite.dev/guide/)
* [TypeScript Documentation](https://www.typescriptlang.org/docs/)
* [MDN Web Docs](https://developer.mozilla.org/)

## Future Work

The following items I plan to fix, improve, and/or add to this project in the future:

* [ ] Add user progress saving so completed lessons can be remembered.
* [ ] Add more concurrency lessons and interactive programming exercises.
* [ ] Improve accessibility testing and keyboard navigation.
* [ ] Add a database to store user progress and custom exercises.
* [ ] Add additional visualizations and simulation scenarios.