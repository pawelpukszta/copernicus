# ADR 0006: The redesign covers the public site only

- **Status:** accepted
- **Date:** 2026-09-08

## Context

An early proposal put the patient portal and the staff portal into the same application as the
public site: patient appointments, test results, documents, and integrations with medical systems
alongside news and contact pages.

The current site already links to a patient portal and an e-Pacjent entry point, so such a system
exists and is part of the provider's medical software estate.

## Decision

This project redesigns and rebuilds the **public site**. The patient and staff portals stay where
they are and are reached by link. If a portal is ever rebuilt, it is a separate application that
consumes the same component package, not additional routes in this repository.

## Why

Test results and appointment data are health data, a special category under Article 9 GDPR. One
application containing both means:

- **One release cadence.** Publishing a news item waits for whatever security review the portal's
  release process requires.
- **One attack surface.** A mistake in a marketing component runs in the same process as a patient
  session.
- **One compliance perimeter.** The data protection impact assessment, the record of processing
  activities and every audit cover the page about parking as well.

Against that, merging has real attractions: one deployment, one design system in one place, one
navigation, and a single login state that lets the homepage greet a signed-in patient. Those are
genuine losses under this decision, and the mitigation is deliberate: shared components published
as a package, a visually consistent portal entry point, and a header that says plainly that the
portal is a separate system so nobody is surprised by a different interface.

**Long term** this is the decision that keeps the public site cheap to change. Content sites want
weekly releases; systems holding medical records want quarterly ones with sign-off. Coupling them
means the slower cadence wins, and after a year the news page is updated by ticket.

## Consequences

- Routes `/pacjent/*` and `/pracownik/*` are not implemented here.
- The header links to the existing portal, labelled as an external system.
- Any authentication in this repository is limited to what the public site itself needs, which is
  currently nothing.
- Should a portal rebuild be commissioned, the first task is extracting `src/components` into a
  published package. The wrapper layer already has the right shape for that.
- Appointment availability, prescriptions and results integrations are explicitly not this
  project's concern. Where the public site must mention them, it links out.
