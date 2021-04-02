==RPAD(s,n,p)== - добавление символов справа.    

***Примеры:***
```sql
SQL> SELECT RPAD(first_name, 15, ' ') || LPAD(salary, 6, ' ')
2  "Wow, it's excellent!" from employees;

Wow, it's excellent!
--------------------------------------------------------------
Steven          24000
Neena           17000
```
---
*tags:* #database, #sql, #sqlFunction #character_func #single-row_func 