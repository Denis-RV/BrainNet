Аналог [[SUBSTR function]], но с возможностью применения регулярных выражений ([[$ Regex введение]]).

***Примеры:***
```sql
SQL> select REGEXP_REPLACE('file.txt, dir, note.txt, go.t, txt.h, txt, m''di.txt', '(\w*\.txt)') Go from dual;

GO
-----------------------------
, dir, , go.t, txt.h, txt, m'
```
---
*теги:* #базы_данных, #sql/function/single-row/character 