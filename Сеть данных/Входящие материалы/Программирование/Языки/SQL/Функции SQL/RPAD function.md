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
*теги:* #базы_данных, #sql/function/single-row/character #sql/function/single-row 