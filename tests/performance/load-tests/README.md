# Load Tests

## How to run the load tests

Run `npm run before-test-load`
This will log a readerUrl and a token to the console
In package.json, in the script for test-load, replace the values of the READER_URL and TOKEN to the values in the console.

Then run `npm run test-load`

in the file /tests/performance/load-tests/load-test.yml you can change the values of duration and arrival_rate to test different loads.
