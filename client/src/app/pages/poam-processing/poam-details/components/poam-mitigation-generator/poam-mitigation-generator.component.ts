/*
!##########################################################################
! CRANE PLAN OF ACTION AND MILESTONE AUTOMATION TOOL (C-PAT) SOFTWARE
! Use is governed by the Open Source Academic Research License Agreement
! contained in the LICENSE.MD file, which is part of this software package.
! BY USING OR MODIFYING THIS SOFTWARE, YOU ARE AGREEING TO THE TERMS AND
! CONDITIONS OF THE LICENSE.
!##########################################################################
*/

import { Component, Input, OnChanges, SimpleChanges, signal, inject, output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MenuItem, MessageService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { DialogModule } from 'primeng/dialog';
import { ProgressBarModule } from 'primeng/progressbar';
import { SplitButtonModule } from 'primeng/splitbutton';
import { TextareaModule } from 'primeng/textarea';
import { ToastModule } from 'primeng/toast';
import { TooltipModule } from 'primeng/tooltip';
import { getErrorMessage } from '../../../../../common/utils/error-utils';
import { PoamService } from '../../../poams.service';

@Component({
  selector: 'cpat-poam-mitigation-generator',
  standalone: true,
  imports: [FormsModule, ButtonModule, TextareaModule, ProgressBarModule, TooltipModule, DialogModule, ConfirmDialogModule, SplitButtonModule, ToastModule],
  templateUrl: './poam-mitigation-generator.component.html'
})
export class PoamMitigationGeneratorComponent implements OnChanges {
  private poamService = inject(PoamService);
  private messageService = inject(MessageService);

  @Input() poam: any;
  @Input() team: any = null;
  @Input() teams: any[] = [];
  readonly mitigationGenerated = output<{
    mitigation: string;
    teamId?: number;
}>();
  aiEnabled: boolean = CPAT.Env.features.aiEnabled;
  isGenerating = signal<boolean>(false);
  showPromptEditor = signal<boolean>(false);
  generatedMitigation: string = '';
  mitigationPrompt: string = '';
  consentDialogVisible: boolean = false;

  items: MenuItem[] = [
    {
      label: 'Cancel',
      icon: 'pi pi-times',
      command: () => {
        this.cancelPromptEdit();
      }
    }
  ];

  mitigationActionItems: MenuItem[] = [
    {
      label: 'Start Over',
      icon: 'pi pi-refresh',
      command: () => {
        this.reset();
        this.initiateGeneration();
      }
    }
  ];

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['teams'] && !changes['teams'].firstChange) {
      if (this.team && !this.teams.some((t) => t.assignedTeamId === this.team.assignedTeamId)) {
        this.reset();
      }
    }

    if (changes['team'] && !changes['team'].firstChange && this.generatedMitigation) {
      this.reset();
    }
  }

  isTeamActive(): boolean {
    if (!this.team) return true;

    return this.team.isActive !== false;
  }

  initiateGeneration() {
    if (this.team && !this.isTeamActive()) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Warning',
        detail: `Cannot generate mitigations for inactive team ${this.team.assignedTeamName}`
      });

      return;
    }

    this.buildMitigationPrompt();
    this.showPromptEditor.set(true);
  }

  generateMitigation() {
    this.showPromptEditor.set(false);
    this.isGenerating.set(true);

    this.poamService.automateMitigation(this.mitigationPrompt).subscribe({
      next: (response) => {
        if (response?.mitigation) {
          this.generatedMitigation = response.mitigation.replace(/\*/g, '');
          this.messageService.add({
            severity: 'success',
            summary: 'Success',
            detail: `Mitigation content generated successfully${this.team ? ' for ' + this.team.assignedTeamName : ''}`
          });
        } else {
          this.messageService.add({
            severity: 'warn',
            summary: 'Warning',
            detail: 'No mitigation content could be generated'
          });
        }

        this.isGenerating.set(false);
      },
      error: (error) => {
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: `Failed to generate mitigation content: ${getErrorMessage(error)}`
        });
        this.isGenerating.set(false);
      }
    });
  }

  private buildMitigationPrompt() {
    this.mitigationPrompt = `Instructions:
You are an expert cyber security architect tasked with creating a comprehensive mitigation strategy for a vulnerability that has been detected within your organization. Your organization CANNOT implement the recommended security control, so you must develop alternative compensating controls. Focus only on specific technical measures that WILL be implemented to achieve the same security objectives as the original control.

Context for Mitigation:
Vulnerability Title: ${this.poam.vulnerabilityTitle}
Vulnerability ID: ${this.poam.vulnerabilityId}

Technical Details:
${
  this.poam.vulnerabilitySource === 'STIG'
    ? `STIG Control Details:
   ${this.poam.stigCheckData}`
    : `Nessus Plugin Details:
   ${this.poam.tenablePluginData}`
}

Required Output:
1. Multiple layers of compensating controls that WILL be implemented
2. For each control:
   - Detailed description of the control
   - Technical implementation approach
   - How it mitigates the specific vulnerability
3. Monitoring and validation measures including:
   - Tools that will be deployed
   - Metrics for effectiveness
   - Validation procedures
4. Overall risk mitigation effectiveness
   - Do not assign a risk rating; instead, provide a brief qualitative assessment of the effectiveness of the compensating controls

Remember:
- Focus only on concrete measures that WILL be implemented, not theoretical possibilities or recommendations.
- Your response should be written as a formal POAM mitigation statement that stands on its own without restating the vulnerability details unless they are applicable to the mitigation.
- Write in a professional, direct tone appropriate for a formal security document.
- Structure your response as a complete mitigation plan that could be copied directly into a POAM document.`;
  }

  applyMitigation() {
    this.consentDialogVisible = true;
  }

  confirmApplyMitigation() {
    this.mitigationGenerated.emit({
      mitigation: this.generatedMitigation,
      teamId: this.team?.assignedTeamId
    });
    this.consentDialogVisible = false;
    this.reset();
  }

  cancelApplyMitigation() {
    this.consentDialogVisible = false;
  }

  cancelPromptEdit() {
    this.showPromptEditor.set(false);
    this.mitigationPrompt = '';
  }

  reset() {
    this.generatedMitigation = '';
    this.mitigationPrompt = '';
    this.showPromptEditor.set(false);
  }
}
