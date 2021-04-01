==Count(`{*|DISTINCT|ALL}`expression`}`)== - считает строки по столбцу любого типа. Слово all ставиться по умолчанию.

***Примеры:***
```sql
SQL> select  count(*) from EMPLOYEES;

  COUNT(*)
----------
       107

select COUNT(SALARY)  
    from EMPLOYEES  
    where SALARY < 5000;  
select count(COMMISSION\_PCT) from EMPLOYEES;  
select count(\*) all\_emp, count(COMMISSION\_PCT) without\_null, count(distinct COMMISSION\_PCT) dist from EMPLOYEES;  
select count('abc') from EMPLOYEES;  
select count(salary), FIRST\_NAME from EMPLOYEES; \--mistake
```
---
*tags:* #database, #sql, #sqlFunction #multiple-row_func 