==LENGTH(s)== - вычисляет длину строки:

***Примеры:***
```sql
SQL> select first_name, LENGTH(first_name) Length from employees
  2  where LENGTH(first_name) <=4;

FIRST_NAME               LENGTH
-------------------- ----------
Amit                          4
John                          4
Lex                           3
Pat                           3
Jean                          4
```
---
*tegs:* #db, #sql, #sqlFunction #single-row_func #character_func 