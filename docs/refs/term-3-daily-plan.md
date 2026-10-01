# Term 3 — Mar 8 to May 16, 2027

Nine weeks of Databases (SQL, C++), Languages & Compilers (Java), and Distributed Systems (Go), then a portfolio week. Tick each evening off as you finish it.

## Setup (before Mar 8)

- [ ] Install Go inside WSL (the 6.5840 labs expect Linux) and the VS Code Go extension
- [ ] Set up a GitHub Codespace for BusTub (C++ builds are too heavy for 4 GB of RAM)
- [ ] Join CMU 15-445's public Gradescope (entry code on the course site)
- [ ] Clone the MIT 6.5840 lab repo
- [ ] Install the Dart SDK to run Crafting Interpreters' official test suite

## Week 1 · Mar 8–14

- [ ] **Mon** · Databases — lectures on the relational model and SQL
- [ ] **Tue** · Compilers — Crafting Interpreters ch. 1–3: the Lox language
- [ ] **Wed** · Distributed — Tour of Go: basics, goroutines, channels
- [ ] **Thu** · Databases — SQL homework: 15 queries in SQLite or Postgres
- [ ] **Fri** · Compilers — ch. 4: jlox scanner + tests
- [ ] **Sat** · Distributed — Go concurrency exercises; read the MapReduce paper
- [ ] **Sun** · Review — `LOG.md` entry, catch up

## Week 2 · Mar 15–21

- [ ] **Mon** · Databases — C++ refresher; BusTub codebase tour
- [ ] **Tue** · Compilers — ch. 5: representing code, the Visitor pattern
- [ ] **Wed** · Distributed — 6.5840 lectures: MapReduce, RPC and threads
- [ ] **Thu** · Databases — BusTub setup in Codespaces; start Project 0
- [ ] **Fri** · Compilers — AST generator
- [ ] **Sat** · Distributed — Lab 1: coordinator and worker RPCs
- [ ] **Sun** · Review — `LOG.md` entry, catch up

## Week 3 · Mar 22–28

- [ ] **Mon** · Databases — lectures on storage: disks, pages, tuple layout
- [ ] **Tue** · Compilers — ch. 6: parsing expressions
- [ ] **Wed** · Distributed — fault tolerance in MapReduce: worker crashes, timeouts
- [ ] **Thu** · Databases — finish Project 0; submit to Gradescope
- [ ] **Fri** · Compilers — recursive-descent parser + tests
- [ ] **Sat** · Distributed — Lab 1: all tests pass
- [ ] **Sun** · Review — `LOG.md` entry, catch up

## Week 4 · Mar 29 – Apr 4

- [ ] **Mon** · Databases — lectures on buffer pools
- [ ] **Tue** · Compilers — ch. 7–8: evaluating expressions, statements and state
- [ ] **Wed** · Distributed — DDIA ch. 5 (replication); linearizability lecture
- [ ] **Thu** · Databases — Project 1: page replacement policy
- [ ] **Fri** · Compilers — interpreter: expressions, variables, statements
- [ ] **Sat** · Distributed — Lab 2: KV server (start)
- [ ] **Sun** · Review — `LOG.md` entry, catch up

## Week 5 · Apr 5–11

- [ ] **Mon** · Databases — lectures on hash tables
- [ ] **Tue** · Compilers — ch. 9: control flow
- [ ] **Wed** · Distributed — DDIA ch. 8: faults, unreliable networks and clocks
- [ ] **Thu** · Databases — Project 1: buffer pool manager; submit
- [ ] **Fri** · Compilers — implement `if`, `while`, `for`
- [ ] **Sat** · Distributed — Lab 2: passes with an unreliable network
- [ ] **Sun** · Review — `LOG.md` entry, catch up

## Week 6 · Apr 12–18

- [ ] **Mon** · Databases — lectures on B+ trees
- [ ] **Tue** · Compilers — ch. 10: functions and closures
- [ ] **Wed** · Distributed — read the Raft paper, sections 1–5
- [ ] **Thu** · Databases — hash table homework; B+ tree design notes
- [ ] **Fri** · Compilers — implement functions, return, closures
- [ ] **Sat** · Distributed — Lab 3A: leader election (start)
- [ ] **Sun** · Review — `LOG.md` entry, catch up

## Week 7 · Apr 19–25

- [ ] **Mon** · Databases — lectures on index concurrency
- [ ] **Tue** · Compilers — ch. 11: resolving and binding
- [ ] **Wed** · Distributed — Raft lecture; Raft visualization
- [ ] **Thu** · Databases — Project 2: B+ tree insert and search
- [ ] **Fri** · Compilers — resolver pass
- [ ] **Sat** · Distributed — Lab 3A: tests pass
- [ ] **Sun** · Review — `LOG.md` entry, catch up

## Week 8 · Apr 26 – May 2

- [ ] **Mon** · Databases — lectures on query execution and joins
- [ ] **Tue** · Compilers — ch. 12–13: classes and inheritance
- [ ] **Wed** · Distributed — Raft log replication
- [ ] **Thu** · Databases — Project 2: delete and iterator
- [ ] **Fri** · Compilers — implement classes and inheritance
- [ ] **Sat** · Distributed — Lab 3B: log replication (stretch)
- [ ] **Sun** · Review — `LOG.md` entry, catch up

## Week 9 · May 3–9

- [ ] **Mon** · Databases — lectures on transactions, MVCC, recovery
- [ ] **Tue** · Compilers — type systems: static vs dynamic, structural typing (compare with TypeScript)
- [ ] **Wed** · Distributed — DDIA ch. 9: consistency and consensus
- [ ] **Thu** · Databases — submit Project 2 (or save it as a stretch); write-up
- [ ] **Fri** · Compilers — jlox passes the official test suite in CI
- [ ] **Sat** · Distributed — write-up: what broke in your labs and why
- [ ] **Sun** · Review — `LOG.md` entry, catch up

## Portfolio week · May 10–16

- [ ] **Mon** · Databases — write-up; screenshot Gradescope scores
- [ ] **Tue** · Compilers — jlox write-up and README
- [ ] **Wed** · Distributed — publish the write-up and lab test logs
- [ ] **Thu** · Portfolio — build the GitHub Pages portfolio page
- [ ] **Fri** · Capstone — draft the one-page design doc for a system at work
- [ ] **Sat** · Capstone — finish and publish
- [ ] **Sun** · Wrap-up — final `LOG.md` summary; share the portfolio link

## Deliverables

- [ ] Private: BusTub Project 0 and Project 1 submitted (Project 2 stretch); score screenshots public
- [ ] Public: jlox interpreter passing the official test suite in CI
- [ ] Private: 6.5840 Lab 1, Lab 2, and Lab 3A passing; test logs + write-up public
- [ ] Public: portfolio page and capstone design doc

## Resources

Linked items are free online; unlinked books are print editions.

| Course | Videos | Books and reading | Practice and tools |
| --- | --- | --- | --- |
| Databases | [CMU 15-445](https://15445.courses.cs.cmu.edu) lectures (CMU Database Group, YouTube) | Silberschatz, Korth & Sudarshan, Database System Concepts; [Use The Index, Luke](https://use-the-index-luke.com) | BusTub projects + public Gradescope; GitHub Codespaces |
| Languages & Compilers | Stanford Compilers, Alex Aiken (optional) | [Crafting Interpreters](https://craftinginterpreters.com); Pierce, Types and Programming Languages | Crafting Interpreters' official test suite (Dart) |
| Distributed Systems | [MIT 6.5840](https://pdos.csail.mit.edu/6.824/) lectures; Kleppmann's Cambridge distributed-systems lectures (YouTube) | Kleppmann, Designing Data-Intensive Applications; [Raft paper and visualization](https://raft.github.io) | 6.5840 labs; [Tour of Go](https://go.dev/tour/) |

Project and lab numbers follow the latest public version of each course and can shift between semesters; follow the course site.
