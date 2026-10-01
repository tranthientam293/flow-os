# Term 2 — Dec 14, 2026 to Mar 7, 2027

Nine weeks of Algorithms II (Java), Operating Systems (C), and Computer Networking (C), with a two-week Tet break after Week 7. Tick each evening off as you finish it.

## Setup (before Dec 14)

- [ ] In WSL Ubuntu, install GCC, make, gdb, and valgrind (all C work for OS and Networking runs in WSL)
- [ ] Install Wireshark on Windows; in WSL, install netcat and `wrk` for load testing
- [ ] Enroll (free) in Algorithms Part II on Coursera
- [ ] Download OSTEP chapters and its homework simulators

## Week 1 · Dec 14–20

- [ ] **Mon** · Algorithms II — undirected graphs lectures
- [ ] **Tue** · OS — CS50 lectures on C memory and pointers
- [ ] **Wed** · Networking — Kurose & Ross ch. 1: the Internet, delay, loss, throughput
- [ ] **Thu** · Algorithms II — WordNet: parse synsets, build the digraph
- [ ] **Fri** · OS — CS50 memory problem set in C
- [ ] **Sat** · Networking — Wireshark capture of a page load; label the DNS, TCP, and HTTP parts
- [ ] **Sun** · Review — `LOG.md` entry, catch up, 3 LeetCode in Java

## Week 2 · Dec 21–27

- [ ] **Mon** · Algorithms II — directed graphs lectures
- [ ] **Tue** · OS — C structs, `malloc`, valgrind
- [ ] **Wed** · Networking — ch. 2: application layer, HTTP
- [ ] **Thu** · Algorithms II — WordNet: SAP and outcast; submit
- [ ] **Fri** · OS — linked list in C, valgrind-clean
- [ ] **Sat** · Networking — send raw HTTP requests with netcat; compare HTTP/1.1 and HTTP/2 in DevTools
- [ ] **Sun** · Review — `LOG.md` entry, catch up, 3 LeetCode in Java

## Week 3 · Dec 28 – Jan 3

- [ ] **Mon** · Algorithms II — minimum spanning trees lectures
- [ ] **Tue** · OS — OSTEP: processes and the process API
- [ ] **Wed** · Networking — Beej's Guide: the sockets API
- [ ] **Thu** · Algorithms II — 3 LeetCode graph problems
- [ ] **Fri** · OS — shell v0: run one command with `fork`, `exec`, `wait`
- [ ] **Sat** · Networking — TCP echo server and client in C
- [ ] **Sun** · Review — `LOG.md` entry, catch up, 3 LeetCode in Java

## Week 4 · Jan 4–10

- [ ] **Mon** · Algorithms II — shortest paths lectures
- [ ] **Tue** · OS — OSTEP: CPU scheduling chapters
- [ ] **Wed** · Networking — ch. 2: DNS and CDNs
- [ ] **Thu** · Algorithms II — Seam Carving; submit
- [ ] **Fri** · OS — OSTEP scheduler simulator homework
- [ ] **Sat** · Networking — DNS query over UDP in C; parse the response
- [ ] **Sun** · Review — `LOG.md` entry, catch up, 3 LeetCode in Java

## Week 5 · Jan 11–17

- [ ] **Mon** · Algorithms II — max flow lectures
- [ ] **Tue** · OS — OSTEP: address spaces, translation, paging
- [ ] **Wed** · Networking — ch. 3: TCP reliability, flow and congestion control
- [ ] **Thu** · Algorithms II — Baseball Elimination; submit
- [ ] **Fri** · OS — OSTEP paging homework
- [ ] **Sat** · Networking — one-page notes on congestion control; find retransmissions in Wireshark
- [ ] **Sun** · Review — `LOG.md` entry, catch up, 3 LeetCode in Java

## Week 6 · Jan 18–24

- [ ] **Mon** · Algorithms II — dynamic programming lectures (MIT 6.006)
- [ ] **Tue** · OS — OSTEP: threads and locks
- [ ] **Wed** · Networking — security chapter: TLS
- [ ] **Thu** · Algorithms II — 4 LeetCode dynamic programming problems
- [ ] **Fri** · OS — producer–consumer with pthreads
- [ ] **Sat** · Networking — inspect a TLS handshake in Wireshark; write notes
- [ ] **Sun** · Review — `LOG.md` entry, catch up, 3 LeetCode in Java

## Week 7 · Jan 25–31

- [ ] **Mon** · Algorithms II — tries and string sorts lectures
- [ ] **Tue** · OS — OSTEP: condition variables, semaphores
- [ ] **Wed** · Networking — ch. 4–5: IP, subnets, NAT, routing
- [ ] **Thu** · Algorithms II — Boggle; submit
- [ ] **Fri** · OS — shell: pipes
- [ ] **Sat** · Networking — traceroute analysis + subnetting exercises
- [ ] **Sun** · Review — `LOG.md` entry, catch up, 3 LeetCode in Java

## Tet break · Feb 1–14

No classes. Optional: catch up on anything unfinished.

## Week 8 · Feb 15–21

- [ ] **Mon** · Algorithms II — substring search and regular expressions lectures
- [ ] **Tue** · OS — OSTEP: I/O devices and file systems
- [ ] **Wed** · Networking — design your HTTP server: request parsing, MIME types
- [ ] **Thu** · Algorithms II — 4 LeetCode string problems
- [ ] **Fri** · OS — shell: redirects (`<`, `>`, `>>`)
- [ ] **Sat** · Networking — HTTP server in C serves static files
- [ ] **Sun** · Review — `LOG.md` entry, catch up, 3 LeetCode in Java

## Week 9 · Feb 22–28

- [ ] **Mon** · Algorithms II — data compression lectures
- [ ] **Tue** · OS — OSTEP: journaling; design background jobs
- [ ] **Wed** · Networking — concurrency: thread pools, keep-alive
- [ ] **Thu** · Algorithms II — Burrows–Wheeler; submit
- [ ] **Fri** · OS — shell: background jobs; valgrind in CI
- [ ] **Sat** · Networking — thread pool + keep-alive; `wrk` load test, results in README
- [ ] **Sun** · Review — `LOG.md` entry, catch up, 3 LeetCode in Java

## Review week · Mar 1–7

- [ ] **Mon** · Algorithms II — write-up; screenshot autograder scores
- [ ] **Tue** · OS — record the shell demo GIF; write-up
- [ ] **Wed** · Networking — write-up with load-test numbers
- [ ] **Thu** · Portfolio — update the README progress table
- [ ] **Fri** · Buffer — finish anything left, or rest
- [ ] **Sat** · Term 3 setup — install Go; set up GitHub Codespaces for BusTub; clone the 6.5840 labs
- [ ] **Sun** · Review — term summary in `LOG.md`

## Deliverables

- [ ] Private: 5 Princeton Part II assignments submitted; score screenshots public
- [ ] Public: 60+ LeetCode problems solved in Java (both terms)
- [ ] Public: C shell with pipes, redirects, and background jobs; demo GIF; valgrind-clean CI
- [ ] Public: multithreaded HTTP/1.1 server in C with load-test results

## Resources

Linked items are free online; unlinked books are print editions.

| Course | Videos | Books and reading | Practice and tools |
| --- | --- | --- | --- |
| Algorithms II | [Princeton Algorithms, Part II (Coursera)](https://www.coursera.org/learn/algorithms-part2); [MIT 6.006](https://ocw.mit.edu/courses/6-006-introduction-to-algorithms-spring-2020/) for dynamic programming | Sedgewick & Wayne, Algorithms, 4th ed. ([book site](https://algs4.cs.princeton.edu)) | Coursera autograder; [NeetCode](https://neetcode.io) problem lists |
| Operating Systems | UC Berkeley CS162 lectures (YouTube); [CS50x](https://cs50.harvard.edu/x/) weeks 1–5 for C | [OSTEP](https://pages.cs.wisc.edu/~remzi/OSTEP/); Kerrisk, The Linux Programming Interface | OSTEP homework simulators; gdb, valgrind in WSL |
| Computer Networking | Kurose & Ross lecture videos (YouTube) | Kurose & Ross, Computer Networking: A Top-Down Approach; [High Performance Browser Networking](https://hpbn.co); [Beej's Guide](https://beej.us/guide/bgnet/) | Wireshark; netcat and `wrk` in WSL |
