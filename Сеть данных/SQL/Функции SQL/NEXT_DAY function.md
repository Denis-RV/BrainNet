==NEXT_DAY(date, day_of_the_week)== - находит следующий день недели. Если у вас американская версия дат, то воскресенье - 1 день недели! Чтобы проверить версию, напишите: `select * from sys.NLS_SESSION_PARAMETERS;`

select NEXT\_DAY(sysdate, 'MON') from dual;***Примеры:***
```sql
SQL> select sysdate, NEXT_DAY(sysdate, 1), NEXT_DAY(sysdate+1, 1) from dual;

SYSDATE   NEXT_DAY( NEXT_DAY(
--------- --------- ---------
10-MAR-21 14-MAR-21 14-MAR-21

SQL> select NEXT_DAY(sysdate, 'MON') from dual;

NEXT_DAY(
---------
15-MAR-21
```
---
*tags:* #database, #sql, #sqlFunction #date_func  #single-row_func 