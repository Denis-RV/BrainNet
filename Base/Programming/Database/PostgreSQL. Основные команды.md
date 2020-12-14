# PostgreSQL. Основные команды

Created: Oct 27, 2020 1:38 AM
need to know: [[Terms SQL]]
status: В процессе
format: flow
Tags: #database #programming 


![%D0%A3%D1%81%D1%82%D0%B0%D0%BD%D0%BE%D0%B2%D0%BA%D0%B0,%20%D0%BD%D0%B0%D1%81%D1%82%D1%80%D0%BE%D0%B8%CC%86%D0%BA%D0%B0,%20%D0%BA%D0%BE%D0%BD%D1%81%D0%BE%D0%BB%D1%8C%20c0c8a7e4a0d74ed08ea556ee5217fee7/Untitled.png](Images/Programming/%D0%A3%D1%81%D1%82%D0%B0%D0%BD%D0%BE%D0%B2%D0%BA%D0%B0,%20%D0%BD%D0%B0%D1%81%D1%82%D1%80%D0%BE%D0%B9%D0%BA%D0%B0,%20%D0%BA%D0%BE%D0%BD%D1%81%D0%BE%D0%BB%D1%8C%20c0c8a7e4a0d74ed08ea556ee5217fee7/Untitled.png)

```bash
$ sudo su - postgres //команда, чтобы зайти под пользователя postgres
$ psql //утилита для работы с sql

\q //выход
\h //commands
\l //доступные бд
\c [database-name]//подключение к бд

\d //просмотр таблиц
```

### See also: 
- [[PostgreSQL (by book)]]