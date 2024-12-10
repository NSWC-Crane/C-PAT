/*
!##########################################################################
! CRANE PLAN OF ACTION AND MILESTONE AUTOMATION TOOL (C-PAT) SOFTWARE
! Use is governed by the Open Source Academic Research License Agreement
! contained in the LICENSE.MD file, which is part of this software package.
! BY USING OR MODIFYING THIS SOFTWARE, YOU ARE AGREEING TO THE TERMS AND    
! CONDITIONS OF THE LICENSE.  
!##########################################################################
*/

import { CommonModule } from '@angular/common';
import { Component, Input, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { DialogModule } from 'primeng/dialog';
import { ProgressBarModule } from 'primeng/progressbar';

@Component({
  selector: 'cpat-status-message',
  templateUrl: './status-message.component.html',
  styleUrls: ['./status-message.component.scss'],
  standalone: true,
  imports: [
    ButtonModule,
    CardModule,
    CommonModule,
    DialogModule,
    FormsModule,
    ProgressBarModule,
  ],
})
export class StatusMessageComponent implements OnInit {
  @Input() statusCode: number;
  message: string = '';

  constructor(private route: ActivatedRoute) {}

  ngOnInit() {
    this.route.data.subscribe((data) => {
      this.statusCode = data['statusCode'];
      this.setMessage();
    });
  }

  setMessage() {
    switch (this.statusCode) {
      case 400:
        this.message = 'Hmm, looks like you made a bad request.';
        break;
      case 401:
        this.message =
          "Hmm, looks like the requested authentication has failed or hasn't been provided yet.";
        break;
      case 403:
        this.message =
          "Sorry, you don't have permission to access this resource.";
        break;
      case 404:
        this.message = "Hmm, looks like that page doesn't exist.";
        break;
      case 405:
        this.message =
          "The method you're trying to use is not allowed for this resource.";
        break;
      case 406:
        this.message =
          'The requested resource is not available in the format you asked for.';
        break;
      case 407:
        this.message =
          'Proxy authentication is required to access this resource.';
        break;
      case 408:
        this.message = 'The server timed out waiting for the request.';
        break;
      case 409:
        this.message =
          'There was a conflict with the current state of the resource.';
        break;
      case 410:
        this.message =
          'The requested resource is no longer available and has been permanently removed.';
        break;
      case 411:
        this.message =
          'The request did not specify the length of its content, which is required by the requested resource.';
        break;
      case 412:
        this.message =
          'The server does not meet one of the preconditions that the requester put on the request.';
        break;
      case 413:
        this.message =
          'The request is larger than the server is willing or able to process.';
        break;
      case 414:
        this.message =
          'The URI provided was too long for the server to process.';
        break;
      case 415:
        this.message =
          'The request entity has a media type which the server or resource does not support.';
        break;
      case 416:
        this.message =
          'The client has asked for a portion of the file, but the server cannot supply that portion.';
        break;
      case 417:
        this.message =
          'The server cannot meet the requirements of the Expect request-header field.';
        break;
      case 418:
        this.message = "RFC 2324, 2.3.2: I'm a teapot";
        break;
      case 422:
        this.message =
          'The request was well-formed but was unable to be followed due to semantic errors.';
        break;
      case 429:
        this.message =
          "You've sent too many requests in a given amount of time.";
        break;
      case 500:
        this.message =
          'The server encountered an unexpected condition that prevented it from fulfilling the request.';
        break;
      case 501:
        this.message =
          'The server does not support the functionality required to fulfill the request.';
        break;
      case 502:
        this.message =
          'The server, while acting as a gateway or proxy, received an invalid response from the upstream server.';
        break;
      case 503:
        this.message = 'The server is currently unavailable.';
        break;
      case 504:
        this.message =
          'The server, while acting as a gateway or proxy, did not receive a timely response from the upstream server.';
        break;
      case 505:
        this.message =
          'The server does not support the HTTP protocol version used in the request.';
        break;
      case 999:
        this.message =
          'Hmm, looks like your account has not been activated. Please contact your C-PAT Administrator.';
        this.statusCode = 403;
        break;
      default:
        this.message = 'An unexpected error occurred.';
        this.statusCode = 500;
    }
  }
}
