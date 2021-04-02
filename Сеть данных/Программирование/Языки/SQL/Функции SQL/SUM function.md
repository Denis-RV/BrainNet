==SUM(`{distinct|all}`expression)== - вычисляет сумму. Работает только с числовыми столбиками. По умолчанию all.

***Примеры:***
```sql
select TO\_CHAR(sum(salary), '$999,999.99' )from EMPLOYEES;  
select sum(COMMISSION\_PCT) t1 , sum(distinct COMMISSION\_PCT) t2 from EMPLOYEES; \--null ignored  
select sum(1), sum('1') from EMPLOYEES;  
select ROUND(sum(sysdate \- hire\_date)/365) years from EMPLOYEES;  
select round(sum(length(FIRST\_NAME)) / count(\*), 3) average from EMPLOYEES;
```
---
*теги:* #database, #sql, #sqlFunction #multiple-row_func 