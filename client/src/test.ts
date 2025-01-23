import 'zone.js/testing';
import { getTestBed } from '@angular/core/testing';
import {
  BrowserDynamicTestingModule,
  platformBrowserDynamicTesting,
} from '@angular/platform-browser-dynamic/testing';

getTestBed().initTestEnvironment(
  BrowserDynamicTestingModule,
  platformBrowserDynamicTesting(),
  {
    teardown: { destroyAfterEach: true }
  }
);

const globalAsAny = (typeof window !== 'undefined' ? window : global) as any;
if (globalAsAny.karma && globalAsAny.karma.loaded) {
  globalAsAny.karma.loaded = () => { };
  globalAsAny.karma.start();
}
