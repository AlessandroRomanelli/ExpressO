import './pre-start'; // Must be the first import
import { compare } from './tester';

compare('./src/tester/examples/specA.yaml', './src/tester/examples/specB.json');
