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
import { createMockRouter } from '../../../../testing/mocks/service-mocks';
import { of, Observable } from 'rxjs';
import { By } from '@angular/platform-browser';

describe('StatusMessageComponent', () => {
  let component: StatusMessageComponent;
  let fixture: ComponentFixture<StatusMessageComponent>;
  let mockRouter: { navigate: ReturnType<typeof vi.fn> };
  let mockActivatedRoute: { data: Observable<{ statusCode: number }> };

  beforeEach(async () => {
    mockRouter = createMockRouter();

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

  const setStatusCode = (code: number) => {
    fixture.componentRef.setInput('statusCode', code);
  };

  describe('initialization', () => {
    it('should create', () => {
      expect(component).toBeTruthy();
    });

    it('should get statusCode from route data if not provided as input', () => {
      fixture.detectChanges();
      expect(component.displayCode()).toBe(404);
    });

    it('should use input statusCode if provided', () => {
      fixture.componentRef.setInput('statusCode', 500);
      fixture.detectChanges();
      expect(component.displayCode()).toBe(500);
    });

    it('should set message on init', () => {
      fixture.detectChanges();
      expect(component.message()).toBeTruthy();
    });
  });

  describe('message resolution - 4xx Client Errors', () => {
    it('should set correct message for 400 Bad Request', () => {
      setStatusCode(400);
      expect(component.message()).toBe('Hmm, looks like you made a bad request.');
    });

    it('should set correct message for 401 Unauthorized', () => {
      setStatusCode(401);
      expect(component.message()).toBe("Hmm, looks like the requested authentication has failed or hasn't been provided yet.");
    });

    it('should set correct message for 403 Forbidden', () => {
      setStatusCode(403);
      expect(component.message()).toBe("Sorry, you don't have permission to access this resource.");
    });

    it('should set correct message for 404 Not Found', () => {
      setStatusCode(404);
      expect(component.message()).toBe("Hmm, looks like that page doesn't exist.");
    });

    it('should set correct message for 405 Method Not Allowed', () => {
      setStatusCode(405);
      expect(component.message()).toBe("The method you're trying to use is not allowed for this resource.");
    });

    it('should set correct message for 406 Not Acceptable', () => {
      setStatusCode(406);
      expect(component.message()).toBe('The requested resource is not available in the format you asked for.');
    });

    it('should set correct message for 407 Proxy Authentication Required', () => {
      setStatusCode(407);
      expect(component.message()).toBe('Proxy authentication is required to access this resource.');
    });

    it('should set correct message for 408 Request Timeout', () => {
      setStatusCode(408);
      expect(component.message()).toBe('The server timed out waiting for the request.');
    });

    it('should set correct message for 409 Conflict', () => {
      setStatusCode(409);
      expect(component.message()).toBe('There was a conflict with the current state of the resource.');
    });

    it('should set correct message for 410 Gone', () => {
      setStatusCode(410);
      expect(component.message()).toBe('The requested resource is no longer available and has been permanently removed.');
    });

    it('should set correct message for 411 Length Required', () => {
      setStatusCode(411);
      expect(component.message()).toBe('The request did not specify the length of its content, which is required by the requested resource.');
    });

    it('should set correct message for 412 Precondition Failed', () => {
      setStatusCode(412);
      expect(component.message()).toBe('The server does not meet one of the preconditions that the requester put on the request.');
    });

    it('should set correct message for 413 Payload Too Large', () => {
      setStatusCode(413);
      expect(component.message()).toBe('The request is larger than the server is willing or able to process.');
    });

    it('should set correct message for 414 URI Too Long', () => {
      setStatusCode(414);
      expect(component.message()).toBe('The URI provided was too long for the server to process.');
    });

    it('should set correct message for 415 Unsupported Media Type', () => {
      setStatusCode(415);
      expect(component.message()).toBe('The request entity has a media type which the server or resource does not support.');
    });

    it('should set correct message for 416 Range Not Satisfiable', () => {
      setStatusCode(416);
      expect(component.message()).toBe('The client has asked for a portion of the file, but the server cannot supply that portion.');
    });

    it('should set correct message for 417 Expectation Failed', () => {
      setStatusCode(417);
      expect(component.message()).toBe('The server cannot meet the requirements of the Expect request-header field.');
    });

    it("should set correct message for 418 I'm a teapot", () => {
      setStatusCode(418);
      expect(component.message()).toBe("RFC 2324, 2.3.2: I'm a teapot");
    });

    it('should set correct message for 422 Unprocessable Entity', () => {
      setStatusCode(422);
      expect(component.message()).toBe('The request was well-formed but was unable to be followed due to semantic errors.');
    });

    it('should set correct message for 429 Too Many Requests', () => {
      setStatusCode(429);
      expect(component.message()).toBe("You've sent too many requests in a given amount of time.");
    });
  });

  describe('message resolution - 5xx Server Errors', () => {
    it('should set correct message for 500 Internal Server Error', () => {
      setStatusCode(500);
      expect(component.message()).toBe('The server encountered an unexpected condition that prevented it from fulfilling the request.');
    });

    it('should set correct message for 501 Not Implemented', () => {
      setStatusCode(501);
      expect(component.message()).toBe('The server does not support the functionality required to fulfill the request.');
    });

    it('should set correct message for 502 Bad Gateway', () => {
      setStatusCode(502);
      expect(component.message()).toBe('The server, while acting as a gateway or proxy, received an invalid response from the upstream server.');
    });

    it('should set correct message for 503 Service Unavailable', () => {
      setStatusCode(503);
      expect(component.message()).toBe('The server is currently unavailable.');
    });

    it('should set correct message for 504 Gateway Timeout', () => {
      setStatusCode(504);
      expect(component.message()).toBe('The server, while acting as a gateway or proxy, did not receive a timely response from the upstream server.');
    });

    it('should set correct message for 505 HTTP Version Not Supported', () => {
      setStatusCode(505);
      expect(component.message()).toBe('The server does not support the HTTP protocol version used in the request.');
    });
  });

  describe('message resolution - Custom Application Codes', () => {
    it('should set correct message for 998 (no collection selected) and display 404', () => {
      setStatusCode(998);
      expect(component.message()).toBe('Hmm, looks like you have not selected a collection. Please click the settings icon in the menu sidebar to make a selection.');
      expect(component.displayCode()).toBe(404);
    });

    it('should set correct message for 999 (account not activated) and display 403', () => {
      setStatusCode(999);
      expect(component.message()).toBe('Hmm, looks like your account is not activated. Please contact your C-PAT Administrator.');
      expect(component.displayCode()).toBe(403);
    });
  });

  describe('message resolution - Default case', () => {
    it('should set default message for unknown status codes', () => {
      setStatusCode(999999);
      expect(component.message()).toBe('An unexpected error occurred.');
      expect(component.displayCode()).toBe(500);
    });

    it('should default to 500 when neither input nor route data provide a status code', async () => {
      TestBed.resetTestingModule();
      await TestBed.configureTestingModule({
        imports: [StatusMessageComponent],
        providers: [
          { provide: Router, useValue: mockRouter },
          { provide: ActivatedRoute, useValue: { data: of({}) } }
        ]
      }).compileComponents();

      const newFixture = TestBed.createComponent(StatusMessageComponent);
      const newComponent = newFixture.componentInstance;

      expect(newComponent.message()).toBe('An unexpected error occurred.');
      expect(newComponent.displayCode()).toBe(500);
    });
  });

  describe('navigateHome', () => {
    it('should navigate to /home when called', () => {
      component.navigateHome();
      expect(mockRouter.navigate).toHaveBeenCalledWith(['/home']);
    });

    it('should navigate to /home when button is clicked', () => {
      fixture.detectChanges();
      const button = fixture.debugElement.query(By.css('p-button'));

      if (button) {
        button.triggerEventHandler('click', null);
        expect(mockRouter.navigate).toHaveBeenCalledWith(['/home']);
      }
    });
  });

  describe('template rendering', () => {
    beforeEach(() => {
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
      const button = fixture.debugElement.query(By.css('button[pButton]'));

      expect(button).toBeTruthy();
    });

    it('should have the status_message_card class on p-card', () => {
      const card = fixture.debugElement.query(By.css('p-card'));

      expect(card).toBeTruthy();
      expect(card.nativeElement.classList).toContain('status_message_card');
    });
  });

  describe('route data subscription', () => {
    it('should use route data when statusCode is not provided', async () => {
      TestBed.resetTestingModule();
      await TestBed.configureTestingModule({
        imports: [StatusMessageComponent],
        providers: [
          { provide: Router, useValue: mockRouter },
          { provide: ActivatedRoute, useValue: { data: of({ statusCode: 500 }) } }
        ]
      }).compileComponents();

      const newFixture = TestBed.createComponent(StatusMessageComponent);
      const newComponent = newFixture.componentInstance;

      newFixture.detectChanges();

      expect(newComponent.displayCode()).toBe(500);
    });
  });
});
