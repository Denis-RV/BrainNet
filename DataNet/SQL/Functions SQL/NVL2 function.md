==NVL2(value, ifnotnull, ifnull== - если есть значение, возвращает ifnotnull, если null, то ifnull. Все параметры должны иметь один и тот же тип данных.

***Примеры:***
```sql
select NVL2(17, 18, 19) from DUAL;  
select NVL2(null, 18, 19) from DUAL;  
select FIRST\_NAME,  
 NVL2(TO\_CHAR(COMMISSION\_PCT, '0.99'),  
 'YES: ' || TO\_CHAR(COMMISSION\_PCT, '0.99'), 'NO')  
    from EMPLOYEES;
```
---
*tegs:* #database, #sql, #sqlFunction #general_func #single-row_func 