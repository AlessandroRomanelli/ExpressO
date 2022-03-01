import './pre-start'; // Must be the first import
import { compareSpecifications } from './tester';

(async () => {
  // tslint:disable-next-line:no-console
  console.log(
    JSON.stringify(
      await compareSpecifications('./spec/tests/examples/v2.yaml', './spec/tests/examples/v3.yaml'),
      null,
      2,
    ),
  );
})();
