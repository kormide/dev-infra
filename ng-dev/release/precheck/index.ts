/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */

import {debug} from 'console';
import {SemVer} from 'semver';
import {error, green, info, red, warn, yellow} from '../../utils/console';
import {BuiltPackageWithInfo, ReleaseConfig} from '../config';

/**
 * Error class that can be used to report precheck failures. Messaging with
 * respect to the pre-check error is required to be handled manually.
 */
export class ReleasePrecheckError extends Error {}

/**
 * Runs the release prechecks and checks whether they are passing for the
 * specified release config, intended new version and built release packages.
 *
 * @returns A boolean that indicates whether the prechecks are passing or not.
 */
export async function assertPassingReleasePrechecks(
  config: ReleaseConfig,
  newVersion: SemVer,
  builtPackagesWithInfo: BuiltPackageWithInfo[],
): Promise<boolean> {
  if (config.prereleaseCheck === undefined) {
    warn(yellow('  ⚠   Skipping release pre-checks. No checks configured.'));
    return true;
  }

  // The user-defined release precheck function is supposed to throw errors upon unmet
  // checks. We catch this here and print a better message and determine the status.
  try {
    // Note: We do not pass the `SemVer` instance to the user-customizable precheck
    // function. This is because we bundled our version of `semver` and the version
    // used in the precheck logic might be different, causing unexpected issues.
    await config.prereleaseCheck(newVersion.format(), builtPackagesWithInfo);
    info(green('  ✓   Release pre-checks passing.'));
    return true;
  } catch (e) {
    if (isReleasePrecheckError(e)) {
      // Note: Error messaging is expected to be handled manually.
      debug(e.message);
      error(red(`  ✘   Release pre-checks failed. Please check the output above.`));
    } else {
      error(red(e), '\n');
      error(red(`  ✘   Release pre-checks errored with unexpected runtime error.`));
    }

    return false;
  }
}

/**
 * Gets whether the given value is a `ReleasePrecheckError`. This helper exists
 * because `instanceof` checks would not work due to us not using code-splitting.
 *
 * TODO(devversion): Remove this when we expose the same code we use in the CLI,
 *   using ESBuild code-splitting.
 */
function isReleasePrecheckError(value: unknown): value is ReleasePrecheckError {
  return (value as Partial<Object>).constructor?.name === 'ReleasePrecheckError';
}
