const tests = [];

function test(name, fn) {
  tests.push({ name, fn });
}

function registerTests(registrar) {
  registrar(test);
}

registerTests(require("./game.test.js"));

async function run() {
  let failures = 0;
  for (const { name, fn } of tests) {
    try {
      await fn();
      console.log(`\u2713 ${name}`);
    } catch (error) {
      failures += 1;
      console.error(`\u2717 ${name}`);
      if (error && error.stack) {
        console.error(error.stack);
      } else {
        console.error(error);
      }
    }
  }

  if (failures > 0) {
    console.error(`\n${failures} test(s) failed.`);
    process.exitCode = 1;
  } else {
    console.log(`\n${tests.length} test(s) passed.`);
  }
}

run().catch((error) => {
  console.error("Test runner encountered an unexpected error:");
  console.error(error && error.stack ? error.stack : error);
  process.exitCode = 1;
});
