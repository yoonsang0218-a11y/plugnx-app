# Settlement OS Intro Website Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development or superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build a public interactive website that explains and demonstrates PlugNX LifeMap + AI Settlement Agent across community, housing, movement, visa, finance and long-term settlement journeys.

**Architecture:** Standalone static site at `/settlement-os/`, leaving `/lifemap/` untouched. Deterministic journey composition, community ranking and BM mapping live in `core.mjs`; illustrative content in `data.mjs`; UI in `app.js`.

**Tech Stack:** HTML5, CSS3, vanilla JavaScript ES modules, GitHub Pages.

**Spec:** `docs/superpowers/specs/2026-09-07-settlement-os-intro-design.md`

## Tasks
- [x] Decision logic: Journey Composer, Community Fit ranking, Settlement Stage, BM mapping.
- [x] Site IA: hero, journey composer, community fit, life events, ladder, visa journeys, execution, AI architecture, property/finance, BM, partner fit.
- [x] Interactions: select controls, preference ranking, tabs, ladder, BM switcher.
- [x] Responsive design and demo disclaimers.
- [x] Link to existing `/lifemap/` detailed product demo.
- [x] Local Node tests and browser interaction smoke test before GitHub integration.