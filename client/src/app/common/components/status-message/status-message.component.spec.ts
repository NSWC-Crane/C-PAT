/*
!##########################################################################
! CRANE PLAN OF ACTION AND MILESTONE AUTOMATION TOOL (C-PAT) SOFTWARE
! Use is governed by the Open Source Academic Research License Agreement
! contained in the LICENSE.MD file, which is part of this software package.
! BY USING OR MODIFYING THIS SOFTWARE, YOU ARE AGREEING TO THE TERMS AND
! CONDITIONS OF THE LICENSE.
!##########################################################################
*/

import { ComponentFixture, TestBed } from '@angular/core/testing';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { StatusMessageComponent } from './status-message.component';
import { ActivatedRoute, Router } from '@angular/router';
import { of, Observable } from 'rxjs';
import { By } from '@angular/platform-browser';

describe('StatusMessageComponent', () => {
  let component: StatusMessageComponent;
  let fixture: ComponentFixture<StatusMessageComponent>;
  let mockRouter: { navigate: ReturnType<typeof vi.fn> };
  let mockActivatedRoute: { data: Observable<{ statusCode: number }> };

  beforeEach(async () => {
    mockRouter = {
      navigate: vi.fn().mockResolvedValue(true)
    };

    mockActivatedRoute = {
      data: of({ statusCode: 404 })
    };

    await TestBed.configureTestingModule({
      imports: [StatusMessageComponent],
      providers: [
        { provide: Router, useValue: mockRouter },
        { provide: ActivatedRoute, useValue: mockActivatedRoute }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(StatusMessageComponent);
    component = fixture.componentInstance;
  });

  describe('initialization', () => {
    it('should create', () => {
      expect(component).toBeTruthy();
    });

    it('should get statusCode from route data if not provided as input', () => {
      fixture.detectChanges();
      expect(component.statusCode).toBe(404);
    });

    it('should use input statusCode if provided', () => {
      component.statusCode = 500;
      fixture.detectChanges();
      expect(component.statusCode).toBe(500);
    });

    it('should set message on init', () => {
      fixture.detectChanges();
      expect(component.message).toBeTruthy();
    });
  });

  describe('setMessage - 4xx Client Errors', () => {
    it('should set correct message for 400 Bad Request', () => {
      component.statusCode = 400;
      component.setMessage();
      expect(component.message).toBe('Hmm, looks like you made a bad request.');
    });

    it('should set correct message for 401 Unauthorized', () => {
      component.statusCode = 401;
      component.setMessage();
      expect(component.message).toBe("Hmm, looks like the requested authentication has failed or hasn't been provided yet.");
    });

    it('should set correct message for 403 Forbidden', () => {
      component.statusCode = 403;
      component.setMessage();
      expect(component.message).toBe("Sorry, you don't have permission to access this resource.");
    });

    it('should set correct message for 404 Not Found', () => {
      component.statusCode = 404;
      component.setMessage();
      expect(component.message).toBe("Hmm, looks like that page doesn't exist.");
    });

    it('should set correct message for 405 Method Not Allowed', () => {
      component.statusCode = 405;
      component.setMessage();
      expect(component.message).toBe("The method you're trying to use is not allowed for this resource.");
    });

    it('should set correct message for 406 Not Acceptable', () => {
      component.statusCode = 406;
      component.setMessage();
      expect(component.message).toBe('The requested resource is not available in the format you asked for.');
    });

    it('should set correct message for 407 Proxy Authentication Required', () => {
      component.statusCode = 407;
      component.setMessage();
      expect(component.message).toBe('Proxy authentication is required to access this resource.');
    });

    it('should set correct message for 408 Request Timeout', () => {
      component.statusCode = 408;
      component.setMessage();
      expect(component.message).toBe('The server timed out waiting for the request.');
    });

    it('should set correct message for 409 Conflict', () => {
      component.statusCode = 409;
      component.setMessage();
      expect(component.message).toBe('There was a conflict with the current state of the resource.');
    });

    it('should set correct message for 410 Gone', () => {
      component.statusCode = 410;
      component.setMessage();
      expect(component.message).toBe('The requested resource is no longer available and has been permanently removed.');
    });

    it('should set correct message for 411 Length Required', () => {
      component.statusCode = 411;
      component.setMessage();
      expect(component.message).toBe('The request did not specify the length of its content, which is required by the requested resource.');
    });

    it('should set correct message for 412 Precondition Failed', () => {
      component.statusCode = 412;
      component.setMessage();
      expect(component.message).toBe('The server does not meet one of the preconditions that the requester put on the request.');
    });

    it('should set correct message for 413 Payload Too Large', () => {
      component.statusCode = 413;
      component.setMessage();
      expect(component.message).toBe('The request is larger than the server is willing or able to process.');
    });

    it('should set correct message for 414 URI Too Long', () => {
      component.statusCode = 414;
      component.setMessage();
      expect(component.message).toBe('The URI provided was too long for the server to process.');
    });

    it('should set correct message for 415 Unsupported Media Type', () => {
      component.statusCode = 415;
      component.setMessage();
      expect(component.message).toBe('The request entity has a media type which the server or resource does not support.');
    });

    it('should set correct message for 416 Range Not Satisfiable', () => {
      component.statusCode = 416;
      component.setMessage();
      expect(component.message).toBe('The client has asked for a portion of the file, but the server cannot supply that portion.');
    });

    it('should set correct message for 417 Expectation Failed', () => {
      component.statusCode = 417;
      component.setMessage();
      expect(component.message).toBe('The server cannot meet the requirements of the Expect request-header field.');
    });

    it("should set correct message for 418 I'm a teapot", () => {
      component.statusCode = 418;
      component.setMessage();
      expect(component.message).toBe("RFC 2324, 2.3.2: I'm a teapot");
    });

    it('should set correct message for 422 Unprocessable Entity', () => {
      component.statusCode = 422;
      component.setMessage();
      expect(component.message).toBe('The request was well-formed but was unable to be followed due to semantic errors.');
    });

    it('should set correct message for 429 Too Many Requests', () => {
      component.statusCode = 429;
      component.setMessage();
      expect(component.message).toBe("You've sent too many requests in a given amount of time.");
    });
  });

  describe('setMessage - 5xx Server Errors', () => {
    it('should set correct message for 500 Internal Server Error', () => {
      component.statusCode = 500;
      component.setMessage();
      expect(component.message).toBe('The server encountered an unexpected condition that prevented it from fulfilling the request.');
    });

    it('should set correct message for 501 Not Implemented', () => {
      component.statusCode = 501;
      component.setMessage();
      expect(component.message).toBe('The server does not support the functionality required to fulfill the request.');
    });

    it('should set correct message for 502 Bad Gateway', () => {
      component.statusCode = 502;
      component.setMessage();
      expect(component.message).toBe('The server, while acting as a gateway or proxy, received an invalid response from the upstream server.');
    });

    it('should set correct message for 503 Service Unavailable', () => {
      component.statusCode = 503;
      component.setMessage();
      expect(component.message).toBe('The server is currently unavailable.');
    });

    it('should set correct message for 504 Gateway Timeout', () => {
      component.statusCode = 504;
      component.setMessage();
      expect(component.message).toBe('The server, while acting as a gateway or proxy, did not receive a timely response from the upstream server.');
    });

    it('should set correct message for 505 HTTP Version Not Supported', () => {
      component.statusCode = 505;
      component.setMessage();
      expect(component.message).toBe('The server does not support the HTTP protocol version used in the request.');
    });
  });

  describe('setMessage - Custom Application Codes', () => {
    it('should set correct message for 998 (no collection selected) and change statusCode to 404', () => {
      component.statusCode = 998;
      component.setMessage();
      expect(component.message).toBe('Hmm, looks like you have not selected a collection. Please click the settings icon in the menu sidebar to make a selection.');
      expect(component.statusCode).toBe(404);
    });

    it('should set correct message for 999 (account not activated) and change statusCode to 403', () => {
      component.statusCode = 999;
      component.setMessage();
      expect(component.message).toBe('Hmm, looks like your account is not activated. Please contact your C-PAT Administrator.');
      expect(component.statusCode).toBe(403);
    });
  });

  describe('setMessage - Default case', () => {
    it('should set default message for unknown status codes', () => {
      component.statusCode = 999999;
      component.setMessage();
      expect(component.message).toBe('An unexpected error occurred.');
      expect(component.statusCode).toBe(500);
    });

    it('should handle undefined statusCode', () => {
      component.statusCode = undefined as any;
      component.setMessage();
      expect(component.message).toBe('An unexpected error occurred.');
      expect(component.statusCode).toBe(500);
    });

    it('should handle null statusCode', () => {
      component.statusCode = null as any;
      component.setMessage();
      expect(component.message).toBe('An unexpected error occurred.');
      expect(component.statusCode).toBe(500);
    });
  });

  describe('navigateToPoamProcessing', () => {
    it('should navigate to /poam-processing when called', () => {
      component.navigateToPoamProcessing();
      expect(mockRouter.navigate).toHaveBeenCalledWith(['/poam-processing']);
    });

    it('should navigate to /poam-processing when button is clicked', () => {
      fixture.detectChanges();
      const button = fixture.debugElement.query(By.css('p-button'));

      if (button) {
        button.triggerEventHandler('click', null);
        expect(mockRouter.navigate).toHaveBeenCalledWith(['/poam-processing']);
      }
    });
  });

  describe('template rendering', () => {
    beforeEach(() => {
      component.statusCode = 404;
      component.setMessage();
      fixture.detectChanges();
    });

    it('should display the status code', () => {
      const h1Element = fixture.debugElement.query(By.css('h1'));

      expect(h1Element).toBeTruthy();
      expect(h1Element.nativeElement.textContent).toContain('404');
    });

    it('should display the message', () => {
      const messageElements = fixture.debugElement.queryAll(By.css('h3'));
      const messageElement = messageElements.find((el) => el.nativeElement.textContent.includes("doesn't exist"));

      expect(messageElement).toBeTruthy();
    });

    it('should display "LOST IN SPACE" text', () => {
      const h3Elements = fixture.debugElement.queryAll(By.css('h3'));
      const lostInSpaceElement = h3Elements.find((el) => el.nativeElement.textContent.includes('LOST IN'));

      expect(lostInSpaceElement).toBeTruthy();
    });

    it('should have the astronaut SVG', () => {
      const astronautSvg = fixture.debugElement.query(By.css('#astronaut'));

      expect(astronautSvg).toBeTruthy();
    });

    it('should have the planet SVG', () => {
      const planetSvg = fixture.debugElement.query(By.css('#planet'));

      expect(planetSvg).toBeTruthy();
    });

    it('should have a refresh button', () => {
      const button = fixture.debugElement.query(By.css('p-button'));

      expect(button).toBeTruthy();
    });

    it('should have the status_message_card class on p-card', () => {
      const card = fixture.debugElement.query(By.css('p-card'));

      expect(card).toBeTruthy();
      expect(card.nativeElement.classList).toContain('status_message_card');
    });
  });

  describe('route data subscription', () => {
    it('should subscribe to route data when statusCode is not provided', async () => {
      const newMockActivatedRoute = {
        data: of({ statusCode: 500 })
      };

      await TestBed.resetTestingModule();
      await TestBed.configureTestingModule({
        imports: [StatusMessageComponent],
        providers: [
          { provide: Router, useValue: mockRouter },
          { provide: ActivatedRoute, useValue: newMockActivatedRoute }
        ]
      }).compileComponents();

      const newFixture = TestBed.createComponent(StatusMessageComponent);
      const newComponent = newFixture.componentInstance;

      newFixture.detectChanges();

      expect(newComponent.statusCode).toBe(500);
    });
  });
});
