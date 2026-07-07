/*
!##########################################################################
! CRANE PLAN OF ACTION AND MILESTONE AUTOMATION TOOL (C-PAT) SOFTWARE
! Use is governed by the Open Source Academic Research License Agreement
! contained in the LICENSE.MD file, which is part of this software package.
! BY USING OR MODIFYING THIS SOFTWARE, YOU ARE AGREEING TO THE TERMS AND
! CONDITIONS OF THE LICENSE.
!##########################################################################
*/

import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { DialogModule } from 'primeng/dialog';
import { ProgressBarModule } from 'primeng/progressbar';

const STATUS_MESSAGES: { [key: number]: string } = {
  400: 'Hmm, looks like you made a bad request.',
  401: "Hmm, looks like the requested authentication has failed or hasn't been provided yet.",
  403: "Sorry, you don't have permission to access this resource.",
  404: "Hmm, looks like that page doesn't exist.",
  405: "The method you're trying to use is not allowed for this resource.",
  406: 'The requested resource is not available in the format you asked for.',
  407: 'Proxy authentication is required to access this resource.',
  408: 'The server timed out waiting for the request.',
  409: 'There was a conflict with the current state of the resource.',
  410: 'The requested resource is no longer available and has been permanently removed.',
  411: 'The request did not specify the length of its content, which is required by the requested resource.',
  412: 'The server does not meet one of the preconditions that the requester put on the request.',
  413: 'The request is larger than the server is willing or able to process.',
  414: 'The URI provided was too long for the server to process.',
  415: 'The request entity has a media type which the server or resource does not support.',
  416: 'The client has asked for a portion of the file, but the server cannot supply that portion.',
  417: 'The server cannot meet the requirements of the Expect request-header field.',
  418: "RFC 2324, 2.3.2: I'm a teapot",
  422: 'The request was well-formed but was unable to be followed due to semantic errors.',
  429: "You've sent too many requests in a given amount of time.",
  500: 'The server encountered an unexpected condition that prevented it from fulfilling the request.',
  501: 'The server does not support the functionality required to fulfill the request.',
  502: 'The server, while acting as a gateway or proxy, received an invalid response from the upstream server.',
  503: 'The server is currently unavailable.',
  504: 'The server, while acting as a gateway or proxy, did not receive a timely response from the upstream server.',
  505: 'The server does not support the HTTP protocol version used in the request.',
  998: 'Hmm, looks like you have not selected a collection. Please click the settings icon in the menu sidebar to make a selection.',
  999: 'Hmm, looks like your account is not activated. Please contact your C-PAT Administrator.'
};

const DISPLAY_CODE_OVERRIDES: { [key: number]: number } = {
  998: 404,
  999: 403
};

@Component({
  selector: 'cpat-status-message',
  templateUrl: './status-message.component.html',
  styleUrls: ['./status-message.component.scss'],
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ButtonModule, CardModule, DialogModule, FormsModule, ProgressBarModule]
})
export class StatusMessageComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  readonly statusCode = input<number>(undefined);

  private readonly routeData = toSignal(this.route.data);
  private readonly rawCode = computed<number | undefined>(() => this.statusCode() ?? this.routeData()?.['statusCode']);

  readonly displayCode = computed<number>(() => {
    const code = this.rawCode();

    if (code == undefined || !(code in STATUS_MESSAGES)) {
      return 500;
    }

    return DISPLAY_CODE_OVERRIDES[code] ?? code;
  });

  readonly message = computed<string>(() => {
    const code = this.rawCode();

    return (code != undefined && STATUS_MESSAGES[code]) || 'An unexpected error occurred.';
  });

  navigateHome() {
    this.router.navigate(['/home']);
  }
}
